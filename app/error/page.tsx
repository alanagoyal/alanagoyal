export default function Error() {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🤔</div>
          <h3 className="text-xl font-bold mb-2">Oops! This page doesn't exist</h3>
          <p className="text-gray-400 text-sm">Please select or create another note</p>
        </div>
      </div>
    );
  }