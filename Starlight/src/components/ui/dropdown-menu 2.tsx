import { 
  DropdownMenu as RNRDropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import React from 'react';
import { View, Pressable, Text } from 'react-native';

interface DropdownMenuItemType {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItemType[];
}

export function DropdownMenu({ trigger, items }: DropdownMenuProps) {
  return (
    <RNRDropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            <DropdownMenuItem
              onPress={item.onPress}
              variant={item.destructive ? 'destructive' : 'default'}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {item.icon && (
                  <View style={{ marginRight: 8 }}>
                    {item.icon}
                  </View>
                )}
                <Text>{item.label}</Text>
              </View>
            </DropdownMenuItem>
            {index < items.length - 1 && <DropdownMenuSeparator />}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </RNRDropdownMenu>
  );
}

// Styles removed - now using React Native Reusables styling
