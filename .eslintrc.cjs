module.exports = {
	root: true,
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'prettier',
		'plugin:svelte/recommended',
		'plugin:tailwindcss/recommended'
	],
	plugins: ['@typescript-eslint', 'prefer-arrow-functions'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ts: '@typescript-eslint/parser',
		js: 'espree',
		typescript: '@typescript-eslint/parser',
		sourceType: 'module',
		ecmaVersion: 2024,
		extraFileExtensions: ['.svelte'],
		ecmaFeatures: {
			globalReturn: false,
			impliedStrict: false,
			jsx: false
		}
	},
	rules: {
		'@typescript-eslint/sort-type-constituents': 'error',
		'no-console': ['error'],
		'prefer-template': ['error'],
		'prefer-arrow-functions/prefer-arrow-functions': [
			'error',
			{
				allowNamedFunctions: false,
				classPropertiesAllowed: false,
				disallowPrototype: false,
				returnStyle: 'implicit',
				singleReturnOnly: false
			}
		]
	},
	ignorePatterns: [
		// Ignore dotfiles
		'.*.js',
		'.*.cjs',
		'.svelte-kit',
		'ios/*',
		'build/*',
		'dist/',
		'node_modules/*',
		'**/*.yaml',
		'**/*.css',
		'**/*.scss',
		/**
		 * SvelteKit TSConfig automatically ignores this:
		 */
		'src/service-worker.js',
		'svelte.config.js',
		'tailwind.config.ts'
	],
	overrides: [
		{
			files: ['*.svelte'],
			parser: 'svelte-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser'
			}
		},
		{ files: ['*.cjs'], env: { node: true } },
		{
			files: ['*.ts', '*.svelte'],
			rules: {
				'@typescript-eslint/sort-type-constituents': 'off',
				'@typescript-eslint/no-unused-vars': 'off',
				'@typescript-eslint/no-explicit-any': [
					'error',
					{
						fixToUnknown: false,
						ignoreRestArgs: true
					}
				],
				'@typescript-eslint/explicit-function-return-type': ['error']
			}
		}
	],
	env: {
		browser: true,
		es6: true,
		node: true
	},
	settings: {
		svelte: {
			ignoreWarnings: [
				/**
				 * 'svelte/no-at-html-tags'
				 *
				 * Used widely for translations.
				 * We are maintaining strict CSP.
				 * Always pay attention in the PRs for @html tags and their source.
				 *
				 * Soon it will be replaced with HTML Sanitizer API:
				 * https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API
				 */
				'svelte/no-at-html-tags',
				/**
				 * Svelte Templates do not support TypeScript,
				 * therefore it's not possible to set the return type.
				 */
				'@typescript-eslint/explicit-function-return-type'
			],
			kit: {
				files: {
					routes: ['src/routes', 'src/lib']
				}
			}
		},
		'import/resolver': {
			typescript: {
				project: './tsconfig.json',
				alwaysTryTypes: true // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
			}
		}
	}
};
