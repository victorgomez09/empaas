import Cookies from "js-cookie";
import type { LanguageCode } from "@/lib/languages";

export default function useLocale() {
	const currentLocale = (Cookies.get("Empaas_LOCALE") ?? "en") as LanguageCode;

	const setLocale = (locale: LanguageCode) => {
		Cookies.set("Empaas_LOCALE", locale, { expires: 365 });
		window.location.reload();
	};

	return {
		locale: currentLocale,
		setLocale,
	};
}
