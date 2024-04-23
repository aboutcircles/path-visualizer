/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				'primary-bg': '#F6F1ED', // Light beige
				'secondary-bg': '#27183E', // Dark purple
				'button-bg': '#e60725', // Bright red
				'secondary-bg-light': '#38318B', // Light purple
				'tertiary-peach': '#FFDABE', // Light peach
				'soft-red': '#FF9786', // Soft red
				'burnt-sienna': '#DF6552', // Burnt sienna
				'dark-gray': '#333333' // Dark gray
			}
		}
	},
	plugins: []
};
