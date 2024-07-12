const emoji = '🤔';
const title = "Oops! This page doesn't exist";
const message = "Please select or create another note";

export default function Error() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">{emoji}</div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-4000 text-sm">{message}</p>
      </div>
    </div>
  );
}