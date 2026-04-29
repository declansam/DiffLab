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
                <p className="text-slate-900 leading-relaxed mb-4">
                    All processing happens locally in your browser or temporarily in memory for the duration of your request. Once you close the tab or refresh the page, your data is gone. There is no database of user content and no logs of the text you compare.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-slate-900">How the Share Link Feature Works</h2>
                <p className="text-slate-900 leading-relaxed mb-4">
                    DiffLab includes a &quot;Share Link&quot; feature that allows you to share your comparison with others. 
                    <strong className="font-semibold"> Importantly, this feature maintains our zero data retention guarantee.</strong>
                </p>
                
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-6 mb-4">
                    <h3 className="font-semibold text-blue-900 mb-2">How it maintains privacy:</h3>
                    <ul className="list-disc list-inside space-y-2 text-slate-900">
                        <li>Your text is <strong>compressed and encoded directly into the URL</strong> itself</li>
                        <li><strong>No server storage</strong> - nothing is saved to our servers or databases</li>
                        <li>The data only exists in the shareable URL you copy</li>
                        <li>Anyone with the link can decode it locally in their browser</li>
                        <li>Once the URL is deleted or lost, the data is permanently gone</li>
                    </ul>
                </div>

                <p className="text-slate-900 leading-relaxed mb-4">
                    <strong>Example:</strong> When you click &quot;Share Link&quot;, your comparison is compressed using LZ-String compression 
                    and encoded into a URL parameter. The resulting URL contains all the information needed to recreate your comparison, 
                    but this happens entirely in the browser without any server-side storage.
                </p>

                <p className="text-sm text-slate-600 italic">
                    Note: URL length limits may restrict very large comparisons (typically up to ~8,000 characters). 
                    For larger files, we recommend using the local file comparison features.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-slate-900">Data Processing</h2>
                <p className="text-slate-900 leading-relaxed">
                    All diff calculations, syntax detection, and formatting happen entirely in your browser using JavaScript. 
                    No text content is ever transmitted to our servers for processing.
                </p>
            </section>
        </main>
    );
}
