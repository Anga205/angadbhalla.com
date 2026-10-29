/**
 * Starter snippets for the code demo.
 *
 * Keyed by algorithm, then language. Adding an algorithm means adding one
 * entry to ALGORITHMS, ALGORITHM_LABELS, and SNIPPETS. Nothing else changes.
 *
 * Every snippet is self-contained, prints something, and reads no stdin, so
 * `run` does something useful with no typing.
 */

export const LANGUAGES = ['python', 'cpp', 'c', 'java'] as const;
export type Language = (typeof LANGUAGES)[number];

export const ALGORITHMS = ['fibonacci', 'factorial', 'sort', 'palindrome'] as const;
export type Algorithm = (typeof ALGORITHMS)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
	python: 'python',
	cpp: 'cpp',
	c: 'c',
	java: 'java',
};

export const ALGORITHM_LABELS: Record<Algorithm, string> = {
	fibonacci: 'fibonacci',
	factorial: 'factorial',
	sort: 'bubble sort',
	palindrome: 'palindrome',
};

export const SNIPPETS: Record<Algorithm, Record<Language, string>> = {
	fibonacci: {
		python: `def fib(n):
    a, b = 0, 1
    for _ in range(n):
        print(a, end=" ")
        a, b = b, a + b
    print()

fib(10)
`,
		cpp: `#include <iostream>

int main() {
    long long a = 0, b = 1;
    for (int i = 0; i < 10; i++) {
        std::cout << a << " ";
        long long next = a + b;
        a = b;
        b = next;
    }
    std::cout << std::endl;
    return 0;
}
`,
		c: `#include <stdio.h>

int main(void) {
    long long a = 0, b = 1;
    for (int i = 0; i < 10; i++) {
        printf("%lld ", a);
        long long next = a + b;
        a = b;
        b = next;
    }
    printf("\\n");
    return 0;
}
`,
		java: `public class Main {
    public static void main(String[] args) {
        long a = 0, b = 1;
        for (int i = 0; i < 10; i++) {
            System.out.print(a + " ");
            long next = a + b;
            a = b;
            b = next;
        }
        System.out.println();
    }
}
`,
	},

	factorial: {
		python: `def fact(n):
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result

print(fact(20))
`,
		cpp: `#include <iostream>

int main() {
    unsigned long long result = 1;
    for (int i = 2; i <= 20; i++) result *= i;
    std::cout << result << std::endl;
    return 0;
}
`,
		c: `#include <stdio.h>

int main(void) {
    unsigned long long result = 1;
    for (int i = 2; i <= 20; i++) result *= i;
    printf("%llu\\n", result);
    return 0;
}
`,
		java: `public class Main {
    public static void main(String[] args) {
        long result = 1;
        for (int i = 2; i <= 20; i++) result *= i;
        System.out.println(result);
    }
}
`,
	},

	sort: {
		python: `def bubble_sort(values):
    values = list(values)
    n = len(values)
    for i in range(n):
        for j in range(n - i - 1):
            if values[j] > values[j + 1]:
                values[j], values[j + 1] = values[j + 1], values[j]
    return values

print(bubble_sort([5, 2, 9, 1, 7, 3]))
`,
		cpp: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> v = {5, 2, 9, 1, 7, 3};
    for (size_t i = 0; i < v.size(); i++)
        for (size_t j = 0; j + 1 < v.size() - i; j++)
            if (v[j] > v[j + 1]) std::swap(v[j], v[j + 1]);
    for (int x : v) std::cout << x << " ";
    std::cout << std::endl;
    return 0;
}
`,
		c: `#include <stdio.h>

int main(void) {
    int v[] = {5, 2, 9, 1, 7, 3};
    int n = 6;
    for (int i = 0; i < n; i++)
        for (int j = 0; j + 1 < n - i; j++)
            if (v[j] > v[j + 1]) {
                int t = v[j];
                v[j] = v[j + 1];
                v[j + 1] = t;
            }
    for (int i = 0; i < n; i++) printf("%d ", v[i]);
    printf("\\n");
    return 0;
}
`,
		java: `public class Main {
    public static void main(String[] args) {
        int[] v = {5, 2, 9, 1, 7, 3};
        for (int i = 0; i < v.length; i++)
            for (int j = 0; j + 1 < v.length - i; j++)
                if (v[j] > v[j + 1]) {
                    int t = v[j];
                    v[j] = v[j + 1];
                    v[j + 1] = t;
                }
        for (int x : v) System.out.print(x + " ");
        System.out.println();
    }
}
`,
	},

	palindrome: {
		python: `def is_palindrome(s):
    cleaned = [c.lower() for c in s if c.isalnum()]
    return cleaned == cleaned[::-1]

for word in ["racecar", "hello", "level"]:
    print(word, is_palindrome(word))
`,
		cpp: `#include <iostream>
#include <string>

bool is_palindrome(const std::string& s) {
    size_t i = 0, j = s.size() - 1;
    while (i < j) {
        if (s[i] != s[j]) return false;
        i++;
        j--;
    }
    return true;
}

int main() {
    for (std::string w : {"racecar", "hello", "level"})
        std::cout << w << " " << is_palindrome(w) << std::endl;
    return 0;
}
`,
		c: `#include <stdio.h>
#include <string.h>

int is_palindrome(const char* s) {
    size_t i = 0, j = strlen(s);
    if (j == 0) return 1;
    j--;
    while (i < j) {
        if (s[i] != s[j]) return 0;
        i++;
        j--;
    }
    return 1;
}

int main(void) {
    const char* words[] = {"racecar", "hello", "level"};
    for (int i = 0; i < 3; i++)
        printf("%s %d\\n", words[i], is_palindrome(words[i]));
    return 0;
}
`,
		java: `public class Main {
    static boolean isPalindrome(String s) {
        int i = 0, j = s.length() - 1;
        while (i < j) {
            if (s.charAt(i) != s.charAt(j)) return false;
            i++;
            j--;
        }
        return true;
    }

    public static void main(String[] args) {
        for (String w : new String[]{"racecar", "hello", "level"})
            System.out.println(w + " " + isPalindrome(w));
    }
}
`,
	},
};
