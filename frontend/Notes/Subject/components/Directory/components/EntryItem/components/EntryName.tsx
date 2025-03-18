function EntryName({ name }: { name: string }) {
  return (
    <div className="pointer-events-none z-50 w-80 truncate text-lg font-medium">
      {name}
    </div>
  )
}

export default EntryName
