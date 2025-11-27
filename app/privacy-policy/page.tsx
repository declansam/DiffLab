import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy | DiffLab",
    description: "Privacy Policy for DiffLab - 0 Data Retention Guarantee",
};

export default function PrivacyPolicy() {
    return (
        <main className="container mx-auto px-4 py-12 max-w-3xl text-slate-900">
            <h1 className="text-3xl font-bold mb-8 text-slate-900">Privacy Policy</h1>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-slate-900">0 Data Retention Guarantee</h2>
                <div className="bg-green-50 border border-green-600 rounded-lg p-6 mb-6">
                    <p className="text-lg font-medium text-green-900">
                        We do not store, save or retain any of the text, code or files you compare on this website.
                    </p>
                </div>
                <p className="text-slate-900 leading-relaxed">
                    All processing happens locally in your browser or temporarily in memory for the duration of your request. Once you close the tab or refresh the page, your data is gone. There is no database of user content and no logs of the text you compare.
                </p>
            </section>
        </main>
    );
}
