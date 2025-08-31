export default function TestStyles() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-blue-500 mb-4">
        Тест Tailwind CSS
      </h1>
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-lg text-white">
        <p className="text-xl">Якщо ви бачите градієнт і стилі - все працює!</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-red-500 p-4 rounded">Червоний</div>
        <div className="bg-green-500 p-4 rounded">Зелений</div>
        <div className="bg-blue-500 p-4 rounded">Синій</div>
      </div>
    </div>
  );
}