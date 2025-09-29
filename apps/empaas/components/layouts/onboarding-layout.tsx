import Link from "next/link";
import type React from "react";

interface Props {
	children: React.ReactNode;
}
export const OnboardingLayout = ({ children }: Props) => {
	return (
		<div className="container relative min-h-svh flex-col items-center justify-center flex lg:max-w-none lg:grid lg:grid-cols-2 lg:px-0 w-full">
			<div className="relative hidden h-full flex-col  p-10 text-primary dark:border-r lg:flex">
				<div className="absolute inset-0 bg-muted" />
				<Link
					href="https://esmosolutions.es"
					className="relative z-20 flex items-center text-lg font-medium gap-4  text-primary"
				>
					{/* <Logo className="size-10" /> */}
					Empaas
				</Link>
				<div className="relative z-20 mt-auto">
					<blockquote className="space-y-2">
						<p className="text-lg text-primary">
							&ldquo;An alternative to Netlify, Vercel, Heroku.&rdquo;
						</p>
					</blockquote>
				</div>
			</div>
			<div className="w-full">
				<div className="flex w-full flex-col justify-center space-y-6 max-w-lg mx-auto">
					{children}
				</div>
			</div>
		</div>
	);
};
