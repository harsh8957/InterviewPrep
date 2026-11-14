import 'dotenv/config';
import mongoose from 'mongoose';
import { Problem } from '../lib/models/Problem';
import { RoadmapNode } from '../lib/models/RoadmapNode';
import { TestCase } from '../lib/models/TestCase';
import { Assessment } from '../lib/models/Assessment';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/echoprep';

export const ROADMAP_DATA = [
  {
    title: 'Arrays and Strings',
    slug: 'arrays-and-strings',
    description: 'Foundations of contiguous memory, indexing, string immutability, and basic operations.',
    category: 'Data Structures',
    order: 1,
    prerequisites: [],
    estimatedHours: 6,
  },
  {
    title: 'Hashing',
    slug: 'hashing',
    description: 'Hash maps and hash sets for O(1) average lookup, frequency counting, and deduplication.',
    category: 'Data Structures',
    order: 2,
    prerequisites: ['arrays-and-strings'],
    estimatedHours: 5,
  },
  {
    title: 'Two Pointers',
    slug: 'two-pointers',
    description: 'Inward, outward, and parallel pointer techniques for searching and rearranging sequences.',
    category: 'Algorithms',
    order: 3,
    prerequisites: ['arrays-and-strings'],
    estimatedHours: 5,
  },
  {
    title: 'Sliding Window',
    slug: 'sliding-window',
    description: 'Fixed and dynamically expanding/shrinking windows for subsegment optimization.',
    category: 'Algorithms',
    order: 4,
    prerequisites: ['two-pointers'],
    estimatedHours: 6,
  },
  {
    title: 'Prefix Sum',
    slug: 'prefix-sum',
    description: 'Cumulative sum arrays and difference arrays for fast range sum queries.',
    category: 'Algorithms',
    order: 5,
    prerequisites: ['arrays-and-strings'],
    estimatedHours: 4,
  },
  {
    title: 'Binary Search',
    slug: 'binary-search',
    description: 'Logarithmic search over sorted arrays, rotated segments, and monotonic answer spaces.',
    category: 'Algorithms',
    order: 6,
    prerequisites: ['arrays-and-strings'],
    estimatedHours: 6,
  },
  {
    title: 'Sorting',
    slug: 'sorting',
    description: 'Comparison-based sorting (Merge, Quick) and interval overlap processing.',
    category: 'Algorithms',
    order: 7,
    prerequisites: ['arrays-and-strings'],
    estimatedHours: 5,
  },
  {
    title: 'Recursion and Backtracking',
    slug: 'recursion-and-backtracking',
    description: 'Exhaustive combinatorial search, state branching, pruning, and permutations/subsets.',
    category: 'Algorithms',
    order: 8,
    prerequisites: ['arrays-and-strings'],
    estimatedHours: 8,
  },
  {
    title: 'Linked Lists',
    slug: 'linked-lists',
    description: 'Singly and doubly linked pointer structures, sentinel nodes, and cycle detection.',
    category: 'Data Structures',
    order: 9,
    prerequisites: ['two-pointers'],
    estimatedHours: 6,
  },
  {
    title: 'Stacks and Queues',
    slug: 'stacks-and-queues',
    description: 'LIFO and FIFO mechanics, monotonic stacks, deque operations, and expression evaluation.',
    category: 'Data Structures',
    order: 10,
    prerequisites: ['arrays-and-strings'],
    estimatedHours: 6,
  },
  {
    title: 'Trees and BST',
    slug: 'trees-and-bst',
    description: 'Binary trees, traversals (pre, in, post, level-order), and BST invariant properties.',
    category: 'Data Structures',
    order: 11,
    prerequisites: ['recursion-and-backtracking'],
    estimatedHours: 8,
  },
  {
    title: 'Heaps',
    slug: 'heaps',
    description: 'Min/max heaps, priority queues, running medians, and top-K frequent element selection.',
    category: 'Data Structures',
    order: 12,
    prerequisites: ['trees-and-bst'],
    estimatedHours: 6,
  },
  {
    title: 'Greedy Algorithms',
    slug: 'greedy-algorithms',
    description: 'Locally optimal choice strategies, interval scheduling, and jump game optimizations.',
    category: 'Algorithms',
    order: 13,
    prerequisites: ['sorting'],
    estimatedHours: 6,
  },
  {
    title: 'Graphs',
    slug: 'graphs',
    description: 'Adjacency representations, BFS, DFS, cycle detection, topological sort, and shortest paths.',
    category: 'Data Structures',
    order: 14,
    prerequisites: ['trees-and-bst', 'stacks-and-queues'],
    estimatedHours: 10,
  },
  {
    title: 'Dynamic Programming',
    slug: 'dynamic-programming',
    description: 'Optimal substructure, overlapping subproblems, memoization, and bottom-up tabulation.',
    category: 'Algorithms',
    order: 15,
    prerequisites: ['recursion-and-backtracking'],
    estimatedHours: 12,
  },
  {
    title: 'Tries and Advanced Topics',
    slug: 'tries-and-advanced',
    description: 'Prefix trees, bit manipulation, disjoint-set union (Union-Find), and segment trees.',
    category: 'Advanced',
    order: 16,
    prerequisites: ['trees-and-bst'],
    estimatedHours: 8,
  },
];

export const PROBLEMS_DATA = [
  {
    title: 'Two Sum',
    slug: 'two-sum',
    roadmapSlug: 'hashing',
    difficulty: 'easy' as const,
    topics: ['Arrays', 'Hashing'],
    patterns: ['Hash Map Lookup'],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    statement: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
      }
    ],
    starterCode: {
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Your code here\n        return {};\n    }\n};`,
      java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n        return new int[]{};\n    }\n}`,
      python: `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        # Your code here\n        return []`,
      javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n    // Your code here\n    return [];\n}`,
      typescript: `function twoSum(nums: number[], target: number): number[] {\n    // Your code here\n    return [];\n}`
    },
    hints: [
      'Can you trade space for time? A brute force approach takes O(N^2).',
      'Use a hash map to store elements you have already seen along with their indices.',
      'For each element x, check if (target - x) is already present in the map.'
    ],
    editorial: `### Approach: Hash Map (One-Pass)

1. Maintain a hash map mapping \`value -> index\`.
2. As you iterate through \`nums\`, compute the complement: \`complement = target - nums[i]\`.
3. If the complement exists in the hash map, return the current index and the complement's stored index.
4. Otherwise, insert \`nums[i]\` into the hash map.

### Complexity:
- **Time Complexity:** $O(N)$ because hash map lookups take $O(1)$ on average.
- **Space Complexity:** $O(N)$ to store up to $N$ entries in the hash map.`,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    companyTags: ['Google', 'Amazon', 'Meta', 'Microsoft'],
    testCases: [
      { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', isHidden: false },
      { input: '[3,2,4]\n6', expectedOutput: '[1,2]', isHidden: false },
      { input: '[3,3]\n6', expectedOutput: '[0,1]', isHidden: true },
      { input: '[-1,-2,-3,-4,-5]\n-8', expectedOutput: '[2,4]', isHidden: true },
    ]
  },
  {
    title: 'Valid Anagram',
    slug: 'valid-anagram',
    roadmapSlug: 'hashing',
    difficulty: 'easy' as const,
    topics: ['Strings', 'Hashing'],
    patterns: ['Frequency Counter'],
    constraints: [
      '1 <= s.length, t.length <= 5 * 10^4',
      's and t consist of lowercase English letters.'
    ],
    statement: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: 'true' },
      { input: 's = "rat", t = "car"', output: 'false' }
    ],
    starterCode: {
      cpp: `class Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        // Your code here\n        return false;\n    }\n};`,
      java: `class Solution {\n    public boolean isAnagram(String s, String t) {\n        // Your code here\n        return false;\n    }\n}`,
      python: `class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        # Your code here\n        return False`,
      javascript: `function isAnagram(s, t) {\n    // Your code here\n    return false;\n}`,
      typescript: `function isAnagram(s: string, t: string): boolean {\n    // Your code here\n    return false;\n}`
    },
    hints: [
      'If s and t have different lengths, they cannot be anagrams.',
      'Count the frequency of each character across both strings using an array of size 26 or a hash map.'
    ],
    editorial: `### Approach: Fixed Frequency Array
Count frequency of each character in \`s\` and decrement for \`t\`. If all counts equal 0 at the end, the strings are anagrams.

### Complexity:
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(1)$ since alphabet size is bounded to 26 lowercase characters.`,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    companyTags: ['Amazon', 'Bloomberg'],
    testCases: [
      { input: '"anagram"\n"nagaram"', expectedOutput: 'true', isHidden: false },
      { input: '"rat"\n"car"', expectedOutput: 'false', isHidden: false },
      { input: '"a"\n"ab"', expectedOutput: 'false', isHidden: true }
    ]
  },
  {
    title: 'Valid Palindrome',
    slug: 'valid-palindrome',
    roadmapSlug: 'two-pointers',
    difficulty: 'easy' as const,
    topics: ['Strings', 'Two Pointers'],
    patterns: ['Converging Pointers'],
    constraints: [
      '1 <= s.length <= 2 * 10^5',
      's consists only of printable ASCII characters.'
    ],
    statement: `A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.`,
    examples: [
      {
        input: 's = "A man, a plan, a canal: Panama"',
        output: 'true',
        explanation: '"amanaplanacanalpanama" is a palindrome.'
      },
      {
        input: 's = "race a car"',
        output: 'false',
        explanation: '"raceacar" is not a palindrome.'
      }
    ],
    starterCode: {
      cpp: `class Solution {\npublic:\n    bool isPalindrome(string s) {\n        // Your code here\n        return false;\n    }\n};`,
      java: `class Solution {\n    public boolean isPalindrome(String s) {\n        // Your code here\n        return false;\n    }\n}`,
      python: `class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        # Your code here\n        return False`,
      javascript: `function isPalindrome(s) {\n    // Your code here\n    return false;\n}`,
      typescript: `function isPalindrome(s: string): boolean {\n    // Your code here\n    return false;\n}`
    },
    hints: [
      'Maintain two pointers: left at index 0 and right at index n-1.',
      'Skip non-alphanumeric characters as the pointers advance toward each other.'
    ],
    editorial: `### Approach: Two Pointers (Converging)
Compare characters from ends moving inward, skipping whitespace and punctuation.

### Complexity:
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(1)$ in-place without copying filtered strings.`,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    companyTags: ['Meta', 'Microsoft'],
    testCases: [
      { input: '"A man, a plan, a canal: Panama"', expectedOutput: 'true', isHidden: false },
      { input: '"race a car"', expectedOutput: 'false', isHidden: false },
      { input: '" "', expectedOutput: 'true', isHidden: true }
    ]
  },
  {
    title: 'Container With Most Water',
    slug: 'container-with-most-water',
    roadmapSlug: 'two-pointers',
    difficulty: 'medium' as const,
    topics: ['Arrays', 'Two Pointers', 'Greedy'],
    patterns: ['Shrinking Boundary'],
    constraints: [
      'n == height.length',
      '2 <= n <= 10^5',
      '0 <= height[i] <= 10^4'
    ],
    statement: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i-th\` line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store. Notice that you may not slant the container.`,
    examples: [
      {
        input: 'height = [1,8,6,2,5,4,8,3,7]',
        output: '49',
        explanation: 'The above vertical lines represent [1,8,6,2,5,4,8,3,7]. The max area is between index 1 and 8: min(8, 7) * (8 - 1) = 49.'
      }
    ],
    starterCode: {
      cpp: `class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        // Your code here\n        return 0;\n    }\n};`,
      java: `class Solution {\n    public int maxArea(int[] height) {\n        // Your code here\n        return 0;\n    }\n}`,
      python: `class Solution:\n    def maxArea(self, height: list[int]) -> int:\n        # Your code here\n        return 0`,
      javascript: `function maxArea(height) {\n    // Your code here\n    return 0;\n}`,
      typescript: `function maxArea(height: number[]): number {\n    // Your code here\n    return 0;\n}`
    },
    hints: [
      'Start with the widest container using pointers at index 0 and index n-1.',
      'The area is limited by the shorter line. Moving the taller line inward can never increase area; moving the shorter line gives a chance to find a taller line.'
    ],
    editorial: `### Approach: Two Pointers Greedy
At each step, calculate \`area = min(height[left], height[right]) * (right - left)\`. Move whichever pointer has the smaller height inward.

### Complexity:
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(1)$`,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    companyTags: ['Amazon', 'Google'],
    testCases: [
      { input: '[1,8,6,2,5,4,8,3,7]', expectedOutput: '49', isHidden: false },
      { input: '[1,1]', expectedOutput: '1', isHidden: false },
      { input: '[4,3,2,1,4]', expectedOutput: '16', isHidden: true }
    ]
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    roadmapSlug: 'sliding-window',
    difficulty: 'medium' as const,
    topics: ['Strings', 'Sliding Window', 'Hashing'],
    patterns: ['Dynamic Sliding Window'],
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.'
    ],
    statement: `Given a string \`s\`, find the length of the longest substring without duplicate characters.`,
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' }
    ],
    starterCode: {
      cpp: `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Your code here\n        return 0;\n    }\n};`,
      java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Your code here\n        return 0;\n    }\n}`,
      python: `class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        # Your code here\n        return 0`,
      javascript: `function lengthOfLongestSubstring(s) {\n    // Your code here\n    return 0;\n}`,
      typescript: `function lengthOfLongestSubstring(s: string): number {\n    // Your code here\n    return 0;\n}`
    },
    hints: [
      'Use a sliding window defined by [left, right].',
      'Store the most recent index of each visited character in a hash map to advance left in O(1).'
    ],
    editorial: `### Approach: Sliding Window with Last Seen Index
Maintain a map of \`char -> lastSeenIndex\`. When a repeating character is encountered, jump the left pointer to \`max(left, map[char] + 1)\`.

### Complexity:
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(\min(N, M))$ where $M$ is alphabet size.`,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(min(N, M))',
    companyTags: ['Amazon', 'Bloomberg', 'Meta'],
    testCases: [
      { input: '"abcabcbb"', expectedOutput: '3', isHidden: false },
      { input: '"bbbbb"', expectedOutput: '1', isHidden: false },
      { input: '"pwwkew"', expectedOutput: '3', isHidden: true }
    ]
  },
  {
    title: 'Subarray Sum Equals K',
    slug: 'subarray-sum-equals-k',
    roadmapSlug: 'prefix-sum',
    difficulty: 'medium' as const,
    topics: ['Arrays', 'Prefix Sum', 'Hashing'],
    patterns: ['Prefix Sum & Hash Map'],
    constraints: [
      '1 <= nums.length <= 2 * 10^4',
      '-1000 <= nums[i] <= 1000',
      '-10^7 <= k <= 10^7'
    ],
    statement: `Given an array of integers \`nums\` and an integer \`k\`, return the total number of subarrays whose sum equals to \`k\`.

A subarray is a contiguous non-empty sequence of elements within an array.`,
    examples: [
      { input: 'nums = [1,1,1], k = 2', output: '2' },
      { input: 'nums = [1,2,3], k = 3', output: '2' }
    ],
    starterCode: {
      cpp: `class Solution {\npublic:\n    int subarraySum(vector<int>& nums, int k) {\n        // Your code here\n        return 0;\n    }\n};`,
      java: `class Solution {\n    public int subarraySum(int[] nums, int k) {\n        // Your code here\n        return 0;\n    }\n}`,
      python: `class Solution:\n    def subarraySum(self, nums: list[int], k: int) -> int:\n        # Your code here\n        return 0`,
      javascript: `function subarraySum(nums, k) {\n    // Your code here\n    return 0;\n}`,
      typescript: `function subarraySum(nums: number[], k: number): number {\n    // Your code here\n    return 0;\n}`
    },
    hints: [
      'If prefixSum[j] - prefixSum[i] = k, then the subarray between i and j sums to k.',
      'Store prefix sum frequencies in a hash map initialized with {0: 1}.'
    ],
    editorial: `### Approach: Prefix Sum + Frequency Map
Maintain running sum. For each element, add \`countMap.get(sum - k) || 0\` to answer, then increment count of \`sum\`.

### Complexity:
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(N)$`,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    companyTags: ['Meta', 'Google'],
    testCases: [
      { input: '[1,1,1]\n2', expectedOutput: '2', isHidden: false },
      { input: '[1,2,3]\n3', expectedOutput: '2', isHidden: false },
      { input: '[1,-1,0]\n0', expectedOutput: '3', isHidden: true }
    ]
  },
  {
    title: 'Binary Search',
    slug: 'binary-search',
    roadmapSlug: 'binary-search',
    difficulty: 'easy' as const,
    topics: ['Arrays', 'Binary Search'],
    patterns: ['Divide and Conquer'],
    constraints: [
      '1 <= nums.length <= 10^4',
      '-10^4 < nums[i], target < 10^4',
      'All the integers in nums are unique.',
      'nums is sorted in ascending order.'
    ],
    statement: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with \`O(log n)\` runtime complexity.`,
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1' }
    ],
    starterCode: {
      cpp: `class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        // Your code here\n        return -1;\n    }\n};`,
      java: `class Solution {\n    public int search(int[] nums, int target) {\n        // Your code here\n        return -1;\n    }\n}`,
      python: `class Solution:\n    def search(self, nums: list[int], target: int) -> int:\n        # Your code here\n        return -1`,
      javascript: `function search(nums, target) {\n    // Your code here\n    return -1;\n}`,
      typescript: `function search(nums: number[], target: number): number {\n    // Your code here\n    return -1;\n}`
    },
    hints: [
      'Calculate mid = left + (right - left) // 2 to avoid integer overflow.',
      'Compare target with nums[mid] and shrink the search interval by half.'
    ],
    editorial: `### Approach: Iterative Binary Search
Maintain pointers left and right. Halve the search space based on comparisons with the midpoint.

### Complexity:
- **Time Complexity:** $O(\\log N)$
- **Space Complexity:** $O(1)$`,
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(1)',
    companyTags: ['Microsoft', 'Apple'],
    testCases: [
      { input: '[-1,0,3,5,9,12]\n9', expectedOutput: '4', isHidden: false },
      { input: '[-1,0,3,5,9,12]\n2', expectedOutput: '-1', isHidden: false },
      { input: '[5]\n5', expectedOutput: '0', isHidden: true }
    ]
  },
  {
    title: 'Search in Rotated Sorted Array',
    slug: 'search-in-rotated-sorted-array',
    roadmapSlug: 'binary-search',
    difficulty: 'medium' as const,
    topics: ['Arrays', 'Binary Search'],
    patterns: ['Rotated Sorted Search'],
    constraints: [
      '1 <= nums.length <= 5000',
      '-10^4 <= nums[i] <= 10^4',
      'All values of nums are unique.',
      'nums is an ascending array that is possibly rotated.'
    ],
    statement: `There is an integer array \`nums\` sorted in ascending order (with distinct values).

Prior to being passed to your function, \`nums\` is possibly rotated at an unknown pivot index.

Given the array \`nums\` after the possible rotation and an integer \`target\`, return the index of \`target\` if it is in \`nums\`, or \`-1\` if it is not in \`nums\`.`,
    examples: [
      { input: 'nums = [4,5,6,7,0,1,2], target = 0', output: '4' },
      { input: 'nums = [4,5,6,7,0,1,2], target = 3', output: '-1' }
    ],
    starterCode: {
      cpp: `class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        // Your code here\n        return -1;\n    }\n};`,
      java: `class Solution {\n    public int search(int[] nums, int target) {\n        // Your code here\n        return -1;\n    }\n}`,
      python: `class Solution:\n    def search(self, nums: list[int], target: int) -> int:\n        # Your code here\n        return -1`,
      javascript: `function search(nums, target) {\n    // Your code here\n    return -1;\n}`,
      typescript: `function search(nums: number[], target: number): number {\n    // Your code here\n    return -1;\n}`
    },
    hints: [
      'In any rotated sorted array, at least one half [left..mid] or [mid..right] is always strictly sorted.',
      'Check if target falls within the bounds of the sorted half to decide where to search next.'
    ],
    editorial: `### Approach: Modified Binary Search
Determine whether the left or right half is normally sorted. Check if target lies within that sorted range.

### Complexity:
- **Time Complexity:** $O(\\log N)$
- **Space Complexity:** $O(1)$`,
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(1)',
    companyTags: ['Meta', 'Amazon', 'Google'],
    testCases: [
      { input: '[4,5,6,7,0,1,2]\n0', expectedOutput: '4', isHidden: false },
      { input: '[4,5,6,7,0,1,2]\n3', expectedOutput: '-1', isHidden: false },
      { input: '[1]\n0', expectedOutput: '-1', isHidden: true }
    ]
  },
  {
    title: 'Merge Intervals',
    slug: 'merge-intervals',
    roadmapSlug: 'sorting',
    difficulty: 'medium' as const,
    topics: ['Arrays', 'Sorting'],
    patterns: ['Interval Merging'],
    constraints: [
      '1 <= intervals.length <= 10^4',
      'intervals[i].length == 2',
      '0 <= start_i <= end_i <= 10^4'
    ],
    statement: `Given an array of \`intervals\` where \`intervals[i] = [start_i, end_i]\`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.`,
    examples: [
      {
        input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
        output: '[[1,6],[8,10],[15,18]]',
        explanation: 'Since intervals [1,3] and [2,6] overlap, merge them into [1,6].'
      }
    ],
    starterCode: {
      cpp: `class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        // Your code here\n        return {};\n    }\n};`,
      java: `class Solution {\n    public int[][] merge(int[][] intervals) {\n        // Your code here\n        return new int[][]{};\n    }\n}`,
      python: `class Solution:\n    def merge(self, intervals: list[list[int]]) -> list[list[int]]:\n        # Your code here\n        return []`,
      javascript: `function merge(intervals) {\n    // Your code here\n    return [];\n}`,
      typescript: `function merge(intervals: number[][]): number[][] {\n    // Your code here\n    return [];\n}`
    },
    hints: [
      'Sort the intervals by their start time first.',
      'Iterate through the sorted intervals. If the current interval start is <= the previous interval end, merge them by updating the end.'
    ],
    editorial: `### Approach: Sort & Linear Sweep
Sort intervals by start position. Merge consecutive overlapping intervals by extending the previous interval end.

### Complexity:
- **Time Complexity:** $O(N \\log N)$
- **Space Complexity:** $O(N)$ for sorting and output storage.`,
    timeComplexity: 'O(N log N)',
    spaceComplexity: 'O(N)',
    companyTags: ['Google', 'Meta'],
    testCases: [
      { input: '[[1,3],[2,6],[8,10],[15,18]]', expectedOutput: '[[1,6],[8,10],[15,18]]', isHidden: false },
      { input: '[[1,4],[4,5]]', expectedOutput: '[[1,5]]', isHidden: false },
      { input: '[[1,4],[0,4]]', expectedOutput: '[[0,4]]', isHidden: true }
    ]
  },
  {
    title: 'Subsets',
    slug: 'subsets',
    roadmapSlug: 'recursion-and-backtracking',
    difficulty: 'medium' as const,
    topics: ['Arrays', 'Backtracking'],
    patterns: ['Combinatorial Backtracking'],
    constraints: [
      '1 <= nums.length <= 10',
      '-10 <= nums[i] <= 10',
      'All the numbers of nums are unique.'
    ],
    statement: `Given an integer array \`nums\` of unique elements, return all possible subsets (the power set).

The solution set must not contain duplicate subsets. Return the solution in any order.`,
    examples: [
      { input: 'nums = [1,2,3]', output: '[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]' },
      { input: 'nums = [0]', output: '[[],[0]]' }
    ],
    starterCode: {
      cpp: `class Solution {\npublic:\n    vector<vector<int>> subsets(vector<int>& nums) {\n        // Your code here\n        return {};\n    }\n};`,
      java: `class Solution {\n    public List<List<Integer>> subsets(int[] nums) {\n        // Your code here\n        return new ArrayList<>();\n    }\n}`,
      python: `class Solution:\n    def subsets(self, nums: list[int]) -> list[list[int]]:\n        # Your code here\n        return []`,
      javascript: `function subsets(nums) {\n    // Your code here\n    return [];\n}`,
      typescript: `function subsets(nums: number[]): number[][] {\n    // Your code here\n    return [];\n}`
    },
    hints: [
      'At each index, you have two choices: include nums[i] or exclude it.',
      'Alternatively, use a backtracking helper with a start index.'
    ],
    editorial: `### Approach: Backtracking / State Space Tree
At each decision point, append current subset snapshot, then branch by including each subsequent element and backtracking.

### Complexity:
- **Time Complexity:** $O(N \\cdot 2^N)$
- **Space Complexity:** $O(N)$ recursion depth.`,
    timeComplexity: 'O(N * 2^N)',
    spaceComplexity: 'O(N)',
    companyTags: ['Amazon', 'Meta'],
    testCases: [
      { input: '[1,2,3]', expectedOutput: '[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]', isHidden: false },
      { input: '[0]', expectedOutput: '[[],[0]]', isHidden: false }
    ]
  },
  {
    title: 'Reverse Linked List',
    slug: 'reverse-linked-list',
    roadmapSlug: 'linked-lists',
    difficulty: 'easy' as const,
    topics: ['Linked Lists'],
    patterns: ['Iterative Inversion'],
    constraints: [
      'The number of nodes in the list is the range [0, 5000].',
      '-5000 <= Node.val <= 5000'
    ],
    statement: `Given the \`head\` of a singly linked list, reverse the list, and return the reversed list.`,
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' },
      { input: 'head = [1,2]', output: '[2,1]' }
    ],
    starterCode: {
      cpp: `/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        // Your code here\n        return nullptr;\n    }\n};`,
      java: `class Solution {\n    public ListNode reverseList(ListNode head) {\n        // Your code here\n        return null;\n    }\n}`,
      python: `class Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        # Your code here\n        return None`,
      javascript: `function reverseList(head) {\n    // Your code here\n    return null;\n}`,
      typescript: `function reverseList(head: ListNode | null): ListNode | null {\n    // Your code here\n    return null;\n}`
    },
    hints: [
      'Track three pointers: prev, curr, and next.',
      'Reverse the pointer direction at each step: curr.next = prev.'
    ],
    editorial: `### Approach: Iterative 3-Pointer
Iterate through the list, repointing each node to its predecessor.

### Complexity:
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(1)$`,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    companyTags: ['Google', 'Amazon', 'Apple'],
    testCases: [
      { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]', isHidden: false },
      { input: '[]', expectedOutput: '[]', isHidden: true }
    ]
  },
  {
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    roadmapSlug: 'stacks-and-queues',
    difficulty: 'easy' as const,
    topics: ['Strings', 'Stack'],
    patterns: ['Bracket Matching'],
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only \'()[]{}\'.'
    ],
    statement: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' }
    ],
    starterCode: {
      cpp: `class Solution {\npublic:\n    bool isValid(string s) {\n        // Your code here\n        return false;\n    }\n};`,
      java: `class Solution {\n    public boolean isValid(String s) {\n        // Your code here\n        return false;\n    }\n}`,
      python: `class Solution:\n    def isValid(self, s: str) -> bool:\n        # Your code here\n        return False`,
      javascript: `function isValid(s) {\n    // Your code here\n    return false;\n}`,
      typescript: `function isValid(s: string): boolean {\n    // Your code here\n    return false;\n}`
    },
    hints: [
      'Push open brackets onto a stack.',
      'When seeing a close bracket, verify that the stack top matches.'
    ],
    editorial: `### Approach: Stack LIFO
Match open and close pairs using a stack. The stack must be empty when complete.

### Complexity:
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(N)$`,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    companyTags: ['Meta', 'Amazon', 'Google'],
    testCases: [
      { input: '"()"', expectedOutput: 'true', isHidden: false },
      { input: '"()[]{}"', expectedOutput: 'true', isHidden: false },
      { input: '"(]"', expectedOutput: 'false', isHidden: true }
    ]
  },
  {
    title: 'Daily Temperatures',
    slug: 'daily-temperatures',
    roadmapSlug: 'stacks-and-queues',
    difficulty: 'medium' as const,
    topics: ['Arrays', 'Stack'],
    patterns: ['Monotonic Stack'],
    constraints: [
      '1 <= temperatures.length <= 10^5',
      '30 <= temperatures[i] <= 100'
    ],
    statement: `Given an array of integers \`temperatures\` represents the daily temperatures, return an array \`answer\` such that \`answer[i]\` is the number of days you have to wait after the \`i-th\` day to get a warmer temperature. If there is no future day for which this is possible, keep \`answer[i] == 0\` instead.`,
    examples: [
      {
        input: 'temperatures = [73,74,75,71,69,72,76,73]',
        output: '[1,1,4,2,1,1,0,0]'
      }
    ],
    starterCode: {
      cpp: `class Solution {\npublic:\n    vector<int> dailyTemperatures(vector<int>& temperatures) {\n        // Your code here\n        return {};\n    }\n};`,
      java: `class Solution {\n    public int[] dailyTemperatures(int[] temperatures) {\n        // Your code here\n        return new int[]{};\n    }\n}`,
      python: `class Solution:\n    def dailyTemperatures(self, temperatures: list[int]) -> list[int]:\n        # Your code here\n        return []`,
      javascript: `function dailyTemperatures(temperatures) {\n    // Your code here\n    return [];\n}`,
      typescript: `function dailyTemperatures(temperatures: number[]): number[] {\n    // Your code here\n    return [];\n}`
    },
    hints: [
      'Use a monotonic decreasing stack holding indices.',
      'Pop elements from the stack whenever the current temperature is warmer than the temperature at the index stored on top.'
    ],
    editorial: `### Approach: Monotonic Decreasing Stack
Stack holds indices of unresolved cold days. When warmer day arrives, pop and resolve wait time: \`ans[prevIdx] = currIdx - prevIdx\`.

### Complexity:
- **Time Complexity:** $O(N)$ each element pushed and popped at most once.
- **Space Complexity:** $O(N)$ for stack.`,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    companyTags: ['Amazon', 'Meta'],
    testCases: [
      { input: '[73,74,75,71,69,72,76,73]', expectedOutput: '[1,1,4,2,1,1,0,0]', isHidden: false },
      { input: '[30,40,50,60]', expectedOutput: '[1,1,1,0]', isHidden: true }
    ]
  },
  {
    title: 'Maximum Depth of Binary Tree',
    slug: 'maximum-depth-of-binary-tree',
    roadmapSlug: 'trees-and-bst',
    difficulty: 'easy' as const,
    topics: ['Trees', 'Depth-First Search', 'Breadth-First Search'],
    patterns: ['Tree Recursion'],
    constraints: [
      'The number of nodes in the tree is in the range [0, 10^4].',
      '-100 <= Node.val <= 100'
    ],
    statement: `Given the \`root\` of a binary tree, return its maximum depth.

A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.`,
    examples: [
      { input: 'root = [3,9,20,null,null,15,7]', output: '3' },
      { input: 'root = [1,null,2]', output: '2' }
    ],
    starterCode: {
      cpp: `class Solution {\npublic:\n    int maxDepth(TreeNode* root) {\n        // Your code here\n        return 0;\n    }\n};`,
      java: `class Solution {\n    public int maxDepth(TreeNode root) {\n        // Your code here\n        return 0;\n    }\n}`,
      python: `class Solution:\n    def maxDepth(self, root: Optional[TreeNode]) -> int:\n        # Your code here\n        return 0`,
      javascript: `function maxDepth(root) {\n    // Your code here\n    return 0;\n}`,
      typescript: `function maxDepth(root: TreeNode | null): number {\n    // Your code here\n    return 0;\n}`
    },
    hints: [
      'Base case: if root is null, depth is 0.',
      'Otherwise depth is 1 + max(maxDepth(root.left), maxDepth(root.right)).'
    ],
    editorial: `### Approach: Recursive DFS
Calculate height of left and right subtrees and return 1 + max of both.

### Complexity:
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(H)$ where $H$ is tree height.`,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(H)',
    companyTags: ['Google', 'Microsoft'],
    testCases: [
      { input: '[3,9,20,null,null,15,7]', expectedOutput: '3', isHidden: false },
      { input: '[]', expectedOutput: '0', isHidden: true }
    ]
  },
  {
    title: 'Kth Largest Element in an Array',
    slug: 'kth-largest-element-in-an-array',
    roadmapSlug: 'heaps',
    difficulty: 'medium' as const,
    topics: ['Arrays', 'Heaps', 'Divide and Conquer'],
    patterns: ['Min-Heap Sizing'],
    constraints: [
      '1 <= k <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4'
    ],
    statement: `Given an integer array \`nums\` and an integer \`k\`, return the \`k-th\` largest element in the array.

Note that it is the \`k-th\` largest element in sorted order, not the \`k-th\` distinct element.

Can you solve it without sorting?`,
    examples: [
      { input: 'nums = [3,2,1,5,6,4], k = 2', output: '5' },
      { input: 'nums = [3,2,3,1,2,4,5,5,6], k = 4', output: '4' }
    ],
    starterCode: {
      cpp: `class Solution {\npublic:\n    int findKthLargest(vector<int>& nums, int k) {\n        // Your code here\n        return 0;\n    }\n};`,
      java: `class Solution {\n    public int findKthLargest(int[] nums, int k) {\n        // Your code here\n        return 0;\n    }\n}`,
      python: `class Solution:\n    def findKthLargest(self, nums: list[int], k: int) -> int:\n        # Your code here\n        return 0`,
      javascript: `function findKthLargest(nums, k) {\n    // Your code here\n    return 0;\n}`,
      typescript: `function findKthLargest(nums: number[], k: number): number {\n    // Your code here\n    return 0;\n}`
    },
    hints: [
      'Maintain a Min-Heap of size k.',
      'Iterate through nums. If heap size exceeds k, pop the minimum. The top of the heap will be the k-th largest.'
    ],
    editorial: `### Approach: Min-Heap of Capacity K
By storing only the K largest elements in a min-heap, the root element is always the K-th largest overall.

### Complexity:
- **Time Complexity:** $O(N \\log K)$
- **Space Complexity:** $O(K)$`,
    timeComplexity: 'O(N log K)',
    spaceComplexity: 'O(K)',
    companyTags: ['Meta', 'Amazon'],
    testCases: [
      { input: '[3,2,1,5,6,4]\n2', expectedOutput: '5', isHidden: false },
      { input: '[3,2,3,1,2,4,5,5,6]\n4', expectedOutput: '4', isHidden: true }
    ]
  },
  {
    title: 'Number of Islands',
    slug: 'number-of-islands',
    roadmapSlug: 'graphs',
    difficulty: 'medium' as const,
    topics: ['Arrays', 'Depth-First Search', 'Breadth-First Search', 'Matrix'],
    patterns: ['Grid Traversal / Connected Components'],
    constraints: [
      'm == grid.length',
      'n == grid[i].length',
      '1 <= m, n <= 300',
      'grid[i][j] is \'0\' or \'1\'.'
    ],
    statement: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return the number of islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.`,
    examples: [
      {
        input: 'grid = [\n  ["1","1","1","1","0"],\n  ["1","1","0","1","0"],\n  ["1","1","0","0","0"],\n  ["0","0","0","0","0"]\n]',
        output: '1'
      }
    ],
    starterCode: {
      cpp: `class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        // Your code here\n        return 0;\n    }\n};`,
      java: `class Solution {\n    public int numIslands(char[][] grid) {\n        // Your code here\n        return 0;\n    }\n}`,
      python: `class Solution:\n    def numIslands(self, grid: list[list[str]]) -> int:\n        # Your code here\n        return 0`,
      javascript: `function numIslands(grid) {\n    // Your code here\n    return 0;\n}`,
      typescript: `function numIslands(grid: string[][]): number {\n    // Your code here\n    return 0;\n}`
    },
    hints: [
      'Iterate through each cell. When finding a "1", increment island count and trigger a BFS/DFS flood fill to sink connected land cells.'
    ],
    editorial: `### Approach: Flood Fill DFS
Traverse 2D matrix. Upon hitting '1', trigger DFS in 4 directions to mutate visited cells to '0'.

### Complexity:
- **Time Complexity:** $O(M \\cdot N)$
- **Space Complexity:** $O(M \\cdot N)$ recursion stack in worst case.`,
    timeComplexity: 'O(M * N)',
    spaceComplexity: 'O(M * N)',
    companyTags: ['Amazon', 'Google', 'Meta'],
    testCases: [
      { input: '[["1","1","0"],["1","1","0"],["0","0","1"]]', expectedOutput: '2', isHidden: false }
    ]
  },
  {
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    roadmapSlug: 'dynamic-programming',
    difficulty: 'easy' as const,
    topics: ['Dynamic Programming', 'Math', 'Memoization'],
    patterns: ['Fibonacci Tabulation'],
    constraints: [
      '1 <= n <= 45'
    ],
    statement: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?`,
    examples: [
      { input: 'n = 2', output: '2', explanation: 'There are two ways: (1 step + 1 step) or (2 steps).' },
      { input: 'n = 3', output: '3', explanation: 'There are three ways: (1+1+1), (1+2), or (2+1).' }
    ],
    starterCode: {
      cpp: `class Solution {\npublic:\n    int climbStairs(int n) {\n        // Your code here\n        return 0;\n    }\n};`,
      java: `class Solution {\n    public int climbStairs(int n) {\n        // Your code here\n        return 0;\n    }\n}`,
      python: `class Solution:\n    def climbStairs(self, n: int) -> int:\n        # Your code here\n        return 0`,
      javascript: `function climbStairs(n) {\n    // Your code here\n    return 0;\n}`,
      typescript: `function climbStairs(n: number): number {\n    // Your code here\n    return 0;\n}`
    },
    hints: [
      'To reach step n, you must arrive from either step n-1 or step n-2.',
      'ways(n) = ways(n-1) + ways(n-2).'
    ],
    editorial: `### Approach: Space-Optimized Dynamic Programming
Recurrence matches Fibonacci: $dp[i] = dp[i-1] + dp[i-2]$. We only need the previous two variables.

### Complexity:
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(1)$`,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    companyTags: ['Amazon', 'Google'],
    testCases: [
      { input: '2', expectedOutput: '2', isHidden: false },
      { input: '3', expectedOutput: '3', isHidden: false },
      { input: '5', expectedOutput: '8', isHidden: true }
    ]
  },
  {
    title: 'Coin Change',
    slug: 'coin-change',
    roadmapSlug: 'dynamic-programming',
    difficulty: 'medium' as const,
    topics: ['Dynamic Programming', 'Breadth-First Search'],
    patterns: ['Unbounded Knapsack / Subproblem Minimization'],
    constraints: [
      '1 <= coins.length <= 12',
      '1 <= coins[i] <= 2^31 - 1',
      '0 <= amount <= 10^4'
    ],
    statement: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.`,
    examples: [
      { input: 'coins = [1,2,5], amount = 11', output: '3', explanation: '11 = 5 + 5 + 1' },
      { input: 'coins = [2], amount = 3', output: '-1' }
    ],
    starterCode: {
      cpp: `class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        // Your code here\n        return -1;\n    }\n};`,
      java: `class Solution {\n    public int coinChange(int[] coins, int amount) {\n        // Your code here\n        return -1;\n    }\n}`,
      python: `class Solution:\n    def coinChange(self, coins: list[int], amount: int) -> int:\n        # Your code here\n        return -1`,
      javascript: `function coinChange(coins, amount) {\n    // Your code here\n    return -1;\n}`,
      typescript: `function coinChange(coins: number[], amount: number): number {\n    // Your code here\n    return -1;\n}`
    },
    hints: [
      'Build an array dp of size amount + 1 initialized to infinity, with dp[0] = 0.',
      'For each amount from 1 to total, try every coin c: dp[i] = min(dp[i], dp[i - c] + 1).'
    ],
    editorial: `### Approach: Bottom-Up Dynamic Programming
Solve subproblems for all amounts up to target. If dp[amount] remains infinity, return -1.

### Complexity:
- **Time Complexity:** $O(\\text{amount} \\cdot \\text{coins.length})$
- **Space Complexity:** $O(\\text{amount})$`,
    timeComplexity: 'O(amount * coins.length)',
    spaceComplexity: 'O(amount)',
    companyTags: ['Amazon', 'Meta'],
    testCases: [
      { input: '[1,2,5]\n11', expectedOutput: '3', isHidden: false },
      { input: '[2]\n3', expectedOutput: '-1', isHidden: false },
      { input: '[1]\n0', expectedOutput: '0', isHidden: true }
    ]
  }
];

export async function seedDSA() {
  console.log('[SeedDSA] Connecting to MongoDB at', MONGODB_URI);
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }

  console.log('[SeedDSA] Seeding Roadmap Nodes...');
  const roadmapNodeMap: Record<string, any> = {};

  for (const nodeData of ROADMAP_DATA) {
    const updated = await RoadmapNode.findOneAndUpdate(
      { slug: nodeData.slug },
      { $set: nodeData },
      { upsert: true, new: true }
    );
    roadmapNodeMap[nodeData.slug] = updated;
    console.log(`  [RoadmapNode] Upserted: ${nodeData.order}. ${nodeData.title} (${nodeData.slug})`);
  }

  console.log('\n[SeedDSA] Seeding Problems and TestCases...');
  const problemIdMap: Record<string, mongoose.Types.ObjectId[]> = {};

  for (const probData of PROBLEMS_DATA) {
    const { testCases, roadmapSlug, ...problemFields } = probData;

    const problem = await Problem.findOneAndUpdate(
      { slug: probData.slug },
      { $set: problemFields },
      { upsert: true, new: true }
    );

    if (!problemIdMap[roadmapSlug]) {
      problemIdMap[roadmapSlug] = [];
    }
    problemIdMap[roadmapSlug].push(problem._id);

    // Seed test cases idempotently
    if (testCases && testCases.length > 0) {
      await TestCase.deleteMany({ problemId: problem._id });
      const testCaseDocs = testCases.map((tc, idx) => ({
        problemId: problem._id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
        order: idx + 1,
      }));
      await TestCase.insertMany(testCaseDocs);
    }

    console.log(`  [Problem] Upserted: ${probData.title} [${probData.difficulty.toUpperCase()}] -> ${roadmapSlug}`);
  }

  console.log('\n[SeedDSA] Linking Associated Problems to Roadmap Nodes...');
  for (const [slug, probIds] of Object.entries(problemIdMap)) {
    await RoadmapNode.updateOne(
      { slug },
      { $set: { associatedProblemIds: probIds } }
    );
    console.log(`  [Link] RoadmapNode '${slug}' linked with ${probIds.length} problems`);
  }

  console.log('\n[SeedDSA] Seeding Sample Assessments...');
  const twoSumProblem = await Problem.findOne({ slug: 'two-sum' });
  const containerProblem = await Problem.findOne({ slug: 'container-with-most-water' });
  const validParenthesesProblem = await Problem.findOne({ slug: 'valid-parentheses' });
  const rotatedSearchProblem = await Problem.findOne({ slug: 'search-in-rotated-sorted-array' });
  const longestSubstringProblem = await Problem.findOne({ slug: 'longest-substring-without-repeating-characters' });
  const climbingStairsProblem = await Problem.findOne({ slug: 'climbing-stairs' });

  const fullstackProblemIds = [
    twoSumProblem?._id,
    containerProblem?._id,
    validParenthesesProblem?._id,
  ].filter(Boolean);

  const coreDsaProblemIds = [
    rotatedSearchProblem?._id,
    longestSubstringProblem?._id,
    climbingStairsProblem?._id,
  ].filter(Boolean);

  await Assessment.findOneAndUpdate(
    { slug: 'fullstack-swe-oa' },
    {
      $set: {
        title: 'Full-Stack Software Engineer Online Assessment',
        slug: 'fullstack-swe-oa',
        description: 'Comprehensive 75-minute algorithmic assessment designed to simulate top-tier tech screening rounds.',
        instructions: [
          'Solve all 3 problems within the allotted 75 minutes.',
          'Execution time and memory limits are strictly evaluated per problem.',
          'Hidden test cases verify boundary edge cases and time complexities.',
          'Submissions after authoritative server expiration will not be accepted.',
        ],
        durationMinutes: 75,
        problemIds: fullstackProblemIds,
        difficulty: 'medium',
        passingScore: 70,
        isPublished: true,
        tags: ['Full-Stack', 'Arrays', 'Two Pointers', 'Stacks', 'FAANG OA'],
      },
    },
    { upsert: true }
  );
  console.log('  [Assessment] Upserted: Full-Stack Software Engineer Online Assessment');

  await Assessment.findOneAndUpdate(
    { slug: 'core-dsa-oa' },
    {
      $set: {
        title: 'Core Algorithms & Data Structures Assessment',
        slug: 'core-dsa-oa',
        description: 'Advanced 60-minute technical assessment covering Binary Search, Sliding Window, and Dynamic Programming.',
        instructions: [
          'Solve 3 algorithmic challenges requiring optimal O(log n) and O(n) complexities.',
          'Each submission is tested against visible examples and hidden stress tests.',
          'Passing threshold is 75% total score across all problems.',
        ],
        durationMinutes: 60,
        problemIds: coreDsaProblemIds,
        difficulty: 'hard',
        passingScore: 75,
        isPublished: true,
        tags: ['Binary Search', 'Sliding Window', 'Dynamic Programming', 'Competitive'],
      },
    },
    { upsert: true }
  );
  console.log('  [Assessment] Upserted: Core Algorithms & Data Structures Assessment');

  console.log('\n[SeedDSA] DSA & Assessment Seed completed successfully!');
}

if (process.argv[1]?.endsWith('seedDSA.ts') || process.argv[1]?.endsWith('seedDSA.js')) {
  seedDSA()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SeedDSA] Error:', err);
      process.exit(1);
    });
}
