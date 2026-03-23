export default function ProjectHeader({ name }: { name: string }) {
  return (
    <div className="w-full text-center py-4 border-b border-gray-100">
      <p className="text-sm text-gray-400">
        פרויקט
      </p>
      <h1 className="text-lg font-semibold text-gray-800">{name}</h1>
    </div>
  )
}
