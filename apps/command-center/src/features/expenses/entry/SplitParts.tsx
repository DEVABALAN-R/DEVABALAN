import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { X } from '@/components/icons';
import { Button, Text } from '@/components/ui';
import { useTheme } from '@/theme';
import { TextField } from '../components/TextField';
import { formatEntry } from '../format';
import { savePerson } from '../state/peopleActions';
import { EntryInput } from './EntryInput';

/** One person's share (or yours) in the split panel. */
export function ShareInput({
  name,
  value,
  onChange,
  onRemove,
}: {
  name: string;
  value: string;
  onChange: (text: string) => void;
  onRemove?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[2] }}>
      <Text variant="label" style={{ width: 84 }} numberOfLines={1}>
        {name}
      </Text>
      <View style={{ flex: 1 }}>
        <EntryInput
          money
          value={value}
          placeholder="0"
          accessibilityLabel={name === 'You' ? 'Your share in rupees' : `${name}'s share in rupees`}
          onChangeText={onChange}
        />
      </View>
      {onRemove ? (
        <Pressable
          role="button"
          accessibilityLabel={`Remove ${name} from the split`}
          onPress={onRemove}
          hitSlop={8}
        >
          <X size={16} color={theme.colors.textTertiary} />
        </Pressable>
      ) : (
        <View style={{ width: 16 }} />
      )}
    </View>
  );
}

/** Your share in the equal modes; in Custom, whether everyone's shares add up to the amount. */
export function SplitStatus({
  amount,
  others,
  mine,
  onRestToMe,
}: {
  amount: number;
  others: number;
  mine: number | null;
  onRestToMe: () => void;
}) {
  const theme = useTheme();
  if (mine === null) {
    return (
      <Text variant="label" color="textSecondary">
        {`Your share ${formatEntry(Math.max(0, amount - others))} · they owe you ${formatEntry(others)}`}
      </Text>
    );
  }
  const gap = amount - others - mine;
  if (gap === 0) {
    return (
      <Text variant="label" color="success">
        {`Adds up to ${formatEntry(amount)} · they owe you ${formatEntry(others)}`}
      </Text>
    );
  }
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[2], flexWrap: 'wrap' }}
    >
      <Text variant="label" color={gap > 0 ? 'warning' : 'danger'} style={{ flex: 1 }}>
        {gap > 0
          ? `${formatEntry(gap)} left to assign of ${formatEntry(amount)}`
          : `${formatEntry(-gap)} more than ${formatEntry(amount)}`}
      </Text>
      {amount - others >= 0 ? (
        <Button label="Rest to me" size="sm" variant="secondary" onPress={onRestToMe} />
      ) : null}
    </View>
  );
}

export function NewPersonForm({ onAdded }: { onAdded: (personId: string) => void }) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const add = () => {
    const result = savePerson(name);
    if (typeof result === 'string') return setError(result);
    onAdded(result.id);
  };
  return (
    <View style={{ gap: theme.space[2] }}>
      <TextField
        label="New person's name"
        value={name}
        onChangeText={setName}
        error={error}
        maxLength={30}
        autoFocus
        onSubmitEditing={add}
      />
      <Button label="Add and split" size="sm" onPress={add} />
    </View>
  );
}
