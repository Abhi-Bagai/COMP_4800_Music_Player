interface ContentProps {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  isCreating: boolean;
  onCreate: (options?: { keepOpen?: boolean }) => void;
  onCancel: () => void;
  tokens: any;
  styles: any;
}
