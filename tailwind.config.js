/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				'primary-bg': '#F6F1ED', // Replace '#1a202c' with your desired color or CSS variable if static
				'secondary-bg': '#27183E', // Replace '#f3f4f6' with your desired color or CSS variable if static
				'button-bg': '#e60725', // Replace '#f3f4f6' with your desired color or CSS variable if static
				'secondary-bg-light': '#38318B' // Replace '#f3f4f6' with your desired color or CSS variable if static
			}
		}
	},
	plugins: []
};
