import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface SettingListProps extends React.ComponentProps<'div'> {
  title: string;
}

export function SettingList({
  title,
  className,
  children,
  ...props
}: SettingListProps) {
  return (
    <div className={cn('flex flex-col', className)} {...props}>
      <h2 className="font-medium text-muted-foreground uppercase text-xs tracking-wider">
        {title}
      </h2>
      <Separator className="mb-1 mt-4" />
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

interface SettingItemProps extends React.ComponentProps<'button'> {
  title: string;
  description: string;
}

export function SettingItem({
  title,
  description,
  className,
  ...props
}: SettingItemProps) {
  return (
    <Button
      className={cn('group h-auto gap-4 py-3 text-left -mx-4', className)}
      variant="ghost"
      {...props}
    >
      <div className="flex flex-col gap-1">
        <span>{title}</span>
        <span className="text-muted-foreground font-normal whitespace-break-spaces">
          {description}
        </span>
      </div>
      <ChevronRight
        className="opacity-60 ml-auto transition-transform group-hover:translate-x-0.5"
        size={16}
        aria-hidden="true"
      />
    </Button>
  );
}
