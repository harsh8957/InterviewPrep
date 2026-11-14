import mongoose from 'mongoose';
import { UserProgress, IUserProgress, ITopicMastery, IWeakTopic, INextRecommendation, MasteryLevel } from '../lib/models/UserProgress';
import { Problem } from '../lib/models/Problem';
import { Submission } from '../lib/models/Submission';
import { ConceptAttempt } from '../lib/models/ConceptAttempt';
import { InterviewResult } from '../lib/models/InterviewResult';
import { AssessmentAttempt } from '../lib/models/AssessmentAttempt';
import { SystemDesignSubmission } from '../lib/models/SystemDesignSubmission';
import { User } from '../lib/models/User';
import { RevisionItem } from '../lib/models/Bookmark';

/**
 * Returns YYYY-MM-DD formatted date string in user's timezone (defaults to UTC).
 */
export function getDateStringInTimezone(date: Date = new Date(), timezone: string = 'UTC'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // Format: YYYY-MM-DD
  } catch (err) {
    // Fallback to UTC if timezone is invalid
    return date.toISOString().slice(0, 10);
  }
}

/**
 * Returns the yesterday YYYY-MM-DD string in user's timezone.
 */
export function getYesterdayStringInTimezone(date: Date = new Date(), timezone: string = 'UTC'): string {
  const yesterday = new Date(date.getTime() - 24 * 60 * 60 * 1000);
  return getDateStringInTimezone(yesterday, timezone);
}

/**
 * Calculates updated streak state idempotently based on user's timezone.
 */
export function calculateUpdatedStreak(
  currentStreakObj: { current: number; longest: number; lastActiveDate: string },
  eventDate: Date = new Date(),
  timezone: string = 'UTC'
): { current: number; longest: number; lastActiveDate: string } {
  const todayStr = getDateStringInTimezone(eventDate, timezone);
  const yesterdayStr = getYesterdayStringInTimezone(eventDate, timezone);

  let current = currentStreakObj.current || 0;
  let longest = currentStreakObj.longest || 0;
  const lastActive = currentStreakObj.lastActiveDate || '';

  if (lastActive === todayStr) {
    // Already active today; streak does not change
    return { current, longest, lastActiveDate: todayStr };
  }

  if (lastActive === yesterdayStr) {
    // Consecutive day
    current += 1;
  } else {
    // Gap occurred or first active day
    current = 1;
  }

  longest = Math.max(longest, current);

  return { current, longest, lastActiveDate: todayStr };
}

/**
 * Classifies numeric mastery score into transparent qualitative mastery level.
 */
export function getMasteryLevel(score: number, itemsAttempted: number): MasteryLevel {
  if (itemsAttempted === 0 || score === 0) return 'Unstarted';
  if (itemsAttempted === 1 && score >= 70) return 'Practicing'; // Never mark expert on 1 problem
  if (score < 30) return 'Beginner';
  if (score < 70) return 'Practicing';
  if (score < 90) return 'Proficient';
  return 'Mastered';
}

/**
 * Full synchronization of a user's progress directly from database events.
 * Fully idempotent, atomic, and safe against state drift.
 */
export async function syncUserProgress(userId: string): Promise<any> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const user = await User.findById(userId).select('profile');
  const userTimezone = user?.profile?.timezone || 'UTC';

  // 1. Fetch all accepted submissions for user
  const acceptedSubmissions = await Submission.find({
    userId: userObjectId,
    status: 'accepted',
  }).populate('problemId', 'title slug difficulty topics');

  // Unique solved problem IDs and difficulty counts
  const solvedProblemIdsSet = new Set<string>();
  const solvedByDiff = { easy: 0, medium: 0, hard: 0 };
  const solvedTopicsCount: { [topic: string]: number } = {};

  for (const sub of acceptedSubmissions) {
    const prob: any = sub.problemId;
    if (!prob) continue;
    const pId = prob._id.toString();

    if (!solvedProblemIdsSet.has(pId)) {
      solvedProblemIdsSet.add(pId);
      if (prob.difficulty === 'easy') solvedByDiff.easy += 1;
      else if (prob.difficulty === 'medium') solvedByDiff.medium += 1;
      else if (prob.difficulty === 'hard') solvedByDiff.hard += 1;

      if (Array.isArray(prob.topics)) {
        for (const t of prob.topics) {
          solvedTopicsCount[t] = (solvedTopicsCount[t] || 0) + 1;
        }
      }
    }
  }

  // 2. Fetch all problem submissions (attempted)
  const allSubmissions = await Submission.find({ userId: userObjectId }).select('problemId createdAt status');
  const attemptedProblemIdsSet = new Set<string>();
  const activityMap: { [date: string]: number } = {};

  for (const sub of allSubmissions) {
    if (sub.problemId) {
      attemptedProblemIdsSet.add(sub.problemId.toString());
    }
    const dStr = getDateStringInTimezone(sub.createdAt, userTimezone);
    activityMap[dStr] = (activityMap[dStr] || 0) + 1;
  }

  // 3. Fetch Core CS Quiz Attempts
  const conceptAttempts = await ConceptAttempt.find({ userId: userObjectId });
  const coreCsBySubjectMap: { [sub: string]: { attempts: number; correct: number } } = {};
  const topicQuizMap: { [topic: string]: { attempts: number; correct: number } } = {};

  let totalCsAttempts = 0;
  let totalCsCorrect = 0;

  for (const ca of conceptAttempts) {
    totalCsAttempts += 1;
    if (ca.isCorrect) totalCsCorrect += 1;

    // By subject
    if (!coreCsBySubjectMap[ca.subject]) {
      coreCsBySubjectMap[ca.subject] = { attempts: 0, correct: 0 };
    }
    coreCsBySubjectMap[ca.subject].attempts += 1;
    if (ca.isCorrect) coreCsBySubjectMap[ca.subject].correct += 1;

    // By topic
    if (!topicQuizMap[ca.topic]) {
      topicQuizMap[ca.topic] = { attempts: 0, correct: 0 };
    }
    topicQuizMap[ca.topic].attempts += 1;
    if (ca.isCorrect) topicQuizMap[ca.topic].correct += 1;

    const dStr = getDateStringInTimezone(ca.createdAt, userTimezone);
    activityMap[dStr] = (activityMap[dStr] || 0) + 1;
  }

  const coreCsBySubject = Object.entries(coreCsBySubjectMap).map(([subject, stats]) => ({
    subject,
    attempts: stats.attempts,
    correct: stats.correct,
    accuracy: stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0,
  }));

  // 4. Fetch System Design Submissions
  const systemDesignSubs = await SystemDesignSubmission.find({ userId: userObjectId });
  let totalSdScore = 0;
  for (const sd of systemDesignSubs) {
    totalSdScore += (sd.aiCritique?.score || 0);
    const dStr = getDateStringInTimezone(sd.createdAt, userTimezone);
    activityMap[dStr] = (activityMap[dStr] || 0) + 1;
  }

  // 5. Fetch Mock Interviews
  const interviewResults = await InterviewResult.find({ candidateId: userObjectId }).sort({ createdAt: -1 });
  let totalInterviewScore = 0;
  const scoreHistory = interviewResults.slice(0, 15).map((ir: any) => {
    totalInterviewScore += (ir.totalScore || 0);
    const dStr = getDateStringInTimezone(ir.createdAt, userTimezone);
    activityMap[dStr] = (activityMap[dStr] || 0) + 1;
    return {
      resultId: ir._id as mongoose.Types.ObjectId,
      date: ir.createdAt,
      score: ir.totalScore || 0,
      mode: (ir as any).interviewMode || 'dsa',
      difficulty: (ir as any).difficulty || 'medium',
    };
  });

  // 6. Fetch Assessments
  const assessmentAttempts = await AssessmentAttempt.find({ userId: userObjectId, status: 'completed' });
  let totalAssScore = 0;
  let passedAssCount = 0;
  for (const aa of assessmentAttempts) {
    totalAssScore += (aa.score || 0);
    if ((aa.score || 0) >= 70) passedAssCount += 1;
    const dStr = getDateStringInTimezone(aa.createdAt, userTimezone);
    activityMap[dStr] = (activityMap[dStr] || 0) + 1;
  }

  // 7. Calculate Topic Mastery across all published topics in catalog
  const publishedProblems = await Problem.find({ status: 'published' }).select('topics difficulty');
  const catalogTopicTotalMap: { [topic: string]: number } = {};
  for (const p of publishedProblems) {
    if (Array.isArray(p.topics)) {
      for (const t of p.topics) {
        catalogTopicTotalMap[t] = (catalogTopicTotalMap[t] || 0) + 1;
      }
    }
  }

  const allTopics = Array.from(new Set([
    ...Object.keys(catalogTopicTotalMap),
    ...Object.keys(solvedTopicsCount),
    ...Object.keys(topicQuizMap),
  ]));

  const topicMasteryList: ITopicMastery[] = allTopics.map(topic => {
    const totalProbs = catalogTopicTotalMap[topic] || 0;
    const solved = solvedTopicsCount[topic] || 0;
    const quizStats = topicQuizMap[topic] || { attempts: 0, correct: 0 };
    const quizAccuracy = quizStats.attempts > 0 ? Math.round((quizStats.correct / quizStats.attempts) * 100) : 0;

    const probRatio = totalProbs > 0 ? (solved / totalProbs) : (solved > 0 ? 1 : 0);
    let masteryScore = 0;

    if (totalProbs > 0 && quizStats.attempts > 0) {
      masteryScore = Math.round(0.6 * probRatio * 100 + 0.4 * quizAccuracy);
    } else if (totalProbs > 0) {
      masteryScore = Math.round(probRatio * 100);
    } else if (quizStats.attempts > 0) {
      masteryScore = quizAccuracy;
    }

    const itemsAttempted = solved + quizStats.attempts;
    const masteryLevel = getMasteryLevel(masteryScore, itemsAttempted);

    return {
      topic,
      problemsSolved: solved,
      totalProblems: totalProbs,
      quizAttempts: quizStats.attempts,
      quizCorrect: quizStats.correct,
      accuracy: quizAccuracy,
      masteryScore,
      masteryLevel,
    };
  });

  // 8. Detect Weak Topics
  const weakTopics: IWeakTopic[] = [];
  for (const tm of topicMasteryList) {
    const attemptedCount = tm.problemsSolved + tm.quizAttempts;
    if (attemptedCount > 0) {
      if (tm.quizAttempts >= 2 && tm.accuracy < 60) {
        weakTopics.push({
          topic: tm.topic,
          reason: `Low quiz accuracy (${tm.accuracy}% across ${tm.quizAttempts} attempts)`,
          accuracy: tm.accuracy,
          recommendation: `Review fundamental concepts and flashcards for ${tm.topic}`,
        });
      } else if (tm.totalProblems >= 2 && tm.problemsSolved / tm.totalProblems < 0.4) {
        weakTopics.push({
          topic: tm.topic,
          reason: `Only ${tm.problemsSolved}/${tm.totalProblems} problems solved in this pattern`,
          accuracy: tm.accuracy,
          recommendation: `Solve foundational practice problems in ${tm.topic}`,
        });
      }
    }
  }

  // 9. Next Learning Recommendations
  const nextRecommendations: INextRecommendation[] = [];

  // Check due revisions first
  const dueRevision = await RevisionItem.findOne({
    userId: userObjectId,
    isCompleted: false,
    nextReviewAt: { $lte: new Date() },
  }).sort({ nextReviewAt: 1 });

  if (dueRevision) {
    nextRecommendations.push({
      type: 'revision',
      title: dueRevision.itemTitle,
      slug: dueRevision.itemSlug,
      reason: 'Scheduled for spaced repetition revision today',
      difficulty: dueRevision.difficulty,
    });
  }

  // Recommend an unsolved problem in a weak topic or unstarted pattern
  const solvedIdsArray = Array.from(solvedProblemIdsSet).map(id => new mongoose.Types.ObjectId(id));
  const candidateProblem = await Problem.findOne({
    _id: { $nin: solvedIdsArray },
    status: 'published',
  }).sort({ difficulty: 1 });

  if (candidateProblem) {
    nextRecommendations.push({
      type: 'problem',
      title: candidateProblem.title,
      slug: candidateProblem.slug,
      reason: `Recommended practice challenge (${candidateProblem.topics[0] || 'Algorithms'})`,
      difficulty: candidateProblem.difficulty,
    });
  }

  // Recommend a system design case if none attempted yet
  if (systemDesignSubs.length === 0) {
    nextRecommendations.push({
      type: 'system_design',
      title: 'Distributed Rate Limiter',
      slug: 'distributed-rate-limiter',
      reason: 'High-frequency distributed architecture case study',
      difficulty: 'medium',
    });
  }

  // 10. Calculate Streak from dates in activityMap
  const sortedDates = Object.keys(activityMap).sort();
  let currentStreak = 0;
  let longestStreak = 0;

  if (sortedDates.length > 0) {
    const todayStr = getDateStringInTimezone(new Date(), userTimezone);
    const yesterdayStr = getYesterdayStringInTimezone(new Date(), userTimezone);

    let tempStreak = 0;
    let prevDate: Date | null = null;

    for (const dStr of sortedDates) {
      const curDate = new Date(`${dStr}T00:00:00Z`);
      if (prevDate) {
        const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));
        if (diffDays === 1) {
          tempStreak += 1;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      prevDate = curDate;
    }

    const lastActiveDate = sortedDates[sortedDates.length - 1];
    if (lastActiveDate === todayStr || lastActiveDate === yesterdayStr) {
      currentStreak = tempStreak;
    } else {
      currentStreak = 0;
    }
  }

  // 11. Atomic Upsert of UserProgress
  const progressDoc = await UserProgress.findOneAndUpdate(
    { userId: userObjectId },
    {
      $set: {
        solvedProblemIds: Array.from(solvedProblemIdsSet).map(id => new mongoose.Types.ObjectId(id)),
        attemptedProblemIds: Array.from(attemptedProblemIdsSet).map(id => new mongoose.Types.ObjectId(id)),
        solvedByDifficulty: solvedByDiff,
        totalSolved: solvedProblemIdsSet.size,
        totalAttempts: allSubmissions.length,
        topicMastery: topicMasteryList,
        streak: {
          current: currentStreak,
          longest: longestStreak,
          lastActiveDate: sortedDates[sortedDates.length - 1] || '',
        },
        dailyActivity: activityMap,
        coreCsStats: {
          totalAttempts: totalCsAttempts,
          totalCorrect: totalCsCorrect,
          overallAccuracy: totalCsAttempts > 0 ? Math.round((totalCsCorrect / totalCsAttempts) * 100) : 0,
          bySubject: coreCsBySubject,
        },
        systemDesignStats: {
          totalSubmitted: systemDesignSubs.length,
          averageScore: systemDesignSubs.length > 0 ? Math.round(totalSdScore / systemDesignSubs.length) : 0,
        },
        mockInterviewStats: {
          totalCompleted: interviewResults.length,
          averageScore: interviewResults.length > 0 ? Math.round(totalInterviewScore / interviewResults.length) : 0,
          scoreHistory,
        },
        assessmentStats: {
          totalAttempts: assessmentAttempts.length,
          passedCount: passedAssCount,
          averageScore: assessmentAttempts.length > 0 ? Math.round(totalAssScore / assessmentAttempts.length) : 0,
        },
        weakTopics,
        nextRecommendations,
        lastCalculatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  return progressDoc;
}

/**
 * Incremental, atomic activity recorder invoked whenever a user completes an action.
 */
export async function recordUserActivity(
  userId: string,
  event: {
    type: 'submission' | 'concept_attempt' | 'system_design' | 'interview' | 'assessment' | 'revision';
    eventDate?: Date;
  }
): Promise<void> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const user = await User.findById(userId).select('profile');
  const userTimezone = user?.profile?.timezone || 'UTC';
  const eventDate = event.eventDate || new Date();
  const dateStr = getDateStringInTimezone(eventDate, userTimezone);

  // Read existing progress or create minimal
  let progress = await UserProgress.findOne({ userId: userObjectId });
  if (!progress) {
    progress = await syncUserProgress(userId);
    return;
  }

  // Update streak
  const updatedStreak = calculateUpdatedStreak(progress.streak, eventDate, userTimezone);

  // Update daily activity map
  const dailyActivity = progress.dailyActivity || {};
  dailyActivity[dateStr] = (dailyActivity[dateStr] || 0) + 1;

  await UserProgress.updateOne(
    { userId: userObjectId },
    {
      $set: {
        streak: updatedStreak,
        dailyActivity,
        lastCalculatedAt: new Date(),
      },
    }
  );
}
