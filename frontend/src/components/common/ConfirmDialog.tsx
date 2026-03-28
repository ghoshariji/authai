import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import Button from './Button';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDark?: boolean;
  danger?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDark = false,
  danger = false,
}) => {
  const backgroundColor = isDark ? colors.card.dark : colors.card.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onCancel}>
        <TouchableOpacity activeOpacity={1}>
          <View style={[styles.dialog, { backgroundColor }, shadow.xl]}>
            <Text style={[styles.title, { color: textColor }]}>{title}</Text>
            <Text style={[styles.message, { color: secondaryColor }]}>{message}</Text>
            <View style={styles.actions}>
              <Button
                title={cancelLabel}
                onPress={onCancel}
                variant="outline"
                style={styles.button}
                size="md"
              />
              <Button
                title={confirmLabel}
                onPress={onConfirm}
                variant={danger ? 'danger' : 'primary'}
                style={styles.button}
                size="md"
              />
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  dialog: {
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    width: '100%',
    maxWidth: 360,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing[2],
  },
  message: {
    fontSize: fontSize.md,
    lineHeight: 22,
    marginBottom: spacing[6],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  button: {
    flex: 1,
  },
});

export default ConfirmDialog;
