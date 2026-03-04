export default function Home() {
  return (
    <div className="max-w-2xl mx-auto mt-16 text-center">
      <h1 className="text-3xl font-bold mb-4">OpenAC Flow Builder</h1>
      <p className="text-gray-600 mb-8">
        Build and visualize anonymous credential flows with deterministic module
        selection, Mermaid diagrams, and interactive drag-and-drop editing.
      </p>
      <div className="flex gap-4 justify-center">
        <a
          href="/scenario"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          MVP1: Scenario Generator
        </a>
        <a
          href="/canvas"
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          MVP3: Canvas Editor
        </a>
      </div>
    </div>
  );
}
