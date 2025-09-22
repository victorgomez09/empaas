/**
 * Sorted list based off of population of the country / speakers of the language.
 */
export const Languages = {
	english: { code: "en", name: "English" },
	spanish: { code: "es", name: "Español" },
	// portuguese: { code: "pt-br", name: "Português" },
	// german: { code: "de", name: "Deutsch" },
	// french: { code: "fr", name: "Français" },
	// italian: { code: "it", name: "Italiano" },
};

export type Language = keyof typeof Languages;
export type LanguageCode = (typeof Languages)[keyof typeof Languages]["code"];
