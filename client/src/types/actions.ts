export type ActionPriority = 'high' | 'medium' | 'approval';

export interface ActionItem {
  id: string;
  priority: ActionPriority;
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
}
