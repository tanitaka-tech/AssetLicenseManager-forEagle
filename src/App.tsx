import { useEaglePlugin } from "@/hooks/useEaglePlugin";

function App() {
  const { theme, folder } = useEaglePlugin();

  return (
    <main data-theme={theme} className="p-4 text-sm">
      <h1 className="text-base font-semibold mb-2">Asset License Manager</h1>
      {folder ? (
        <p>
          Selected folder: <code>{folder.name}</code>
        </p>
      ) : (
        <p className="opacity-70">No folder is selected.</p>
      )}
    </main>
  );
}

export default App;
