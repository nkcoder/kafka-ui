interface HeaderProps {
  title: string;
  description: string;
}

export const Header = ({ title, description }: HeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme toggle will go here */}
        <button type="button" className="p-2 rounded-md hover:bg-secondary">
          <span className="text-lg">🌙</span>
        </button>
      </div>
    </div>
  );
};
