import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, Image, ActivityIndicator,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../theme/colors';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { api } from '../../services/api';

type NoticeType = 'GENERAL' | 'ACADEMIC' | 'EXAM' | 'EVENT' | 'URGENT';
type TargetAudience = 'ALL' | 'STUDENTS' | 'TEACHERS';

interface Attachment {
  uri: string;
  name: string;
  type: string;
  size?: number;
  isImage: boolean;
  preview?: string;
}

const NOTICE_TYPES: { value: NoticeType; label: string; color: string }[] = [
  { value: 'GENERAL', label: 'General', color: colors.info },
  { value: 'ACADEMIC', label: 'Academic', color: colors.primary },
  { value: 'EXAM', label: 'Exam', color: colors.warning },
  { value: 'EVENT', label: 'Event', color: colors.success },
  { value: 'URGENT', label: 'Urgent', color: colors.error },
];

const TARGET_OPTIONS: { value: TargetAudience; label: string; icon: string }[] = [
  { value: 'ALL', label: 'Everyone', icon: '🌐' },
  { value: 'STUDENTS', label: 'Students only', icon: '🎓' },
  { value: 'TEACHERS', label: 'Teachers only', icon: '👨‍🏫' },
];

const CreateNoticeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isDark } = useTheme();
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'GENERAL' as NoticeType,
    targetAudience: 'ALL' as TargetAudience,
    expiresAt: '',
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const bg = isDark ? '#1A1A2E' : '#F8F9FD';
  const cardBg = isDark ? '#16213E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1A1A2E';
  const subtextColor = isDark ? '#A0A0B0' : '#666680';
  const borderColor = isDark ? '#2D2D4E' : '#E8E8F0';

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.content.trim()) errs.content = 'Content is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddImage = async () => {
    if (attachments.length >= 5) {
      Toast.show({ type: 'info', text1: 'Maximum 5 attachments allowed' });
      return;
    }
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
      if (asset) {
        setAttachments(prev => [...prev, {
          uri: asset.uri!,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
          size: asset.fileSize,
          isImage: true,
          preview: asset.uri!,
        }]);
      }
    });
  };

  const handleAddPDF = async () => {
    if (attachments.length >= 5) {
      Toast.show({ type: 'info', text1: 'Maximum 5 attachments allowed' });
      return;
    }
    try {
      const picked = await DocumentPicker.pickSingle({ type: [DocumentPicker.types.pdf] });
      setAttachments(prev => [...prev, {
        uri: picked.fileCopyUri || picked.uri,
        name: picked.name || `document_${Date.now()}.pdf`,
        type: 'application/pdf',
        size: picked.size || undefined,
        isImage: false,
      }]);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Toast.show({ type: 'error', text1: 'Could not pick file' });
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('content', form.content.trim());
      formData.append('type', form.type);
      formData.append('targetAudience', form.targetAudience);
      if (form.expiresAt) formData.append('expiresAt', form.expiresAt);

      attachments.forEach((att, i) => {
        formData.append('attachments', {
          uri: att.uri,
          name: att.name,
          type: att.type,
        } as any);
      });

      await api.post('/notices', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Toast.show({ type: 'success', text1: 'Notice posted!', text2: 'All recipients have been notified.' });
      navigation.goBack();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to post notice',
        text2: err?.response?.data?.message || 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = NOTICE_TYPES.find(t => t.value === form.type)!;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />
      <Header title="Create Notice" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Input
            label="Notice Title"
            value={form.title}
            onChangeText={v => setForm(f => ({ ...f, title: v }))}
            placeholder="Enter a clear, concise title"
            leftIcon="bulletin-board"
            error={errors.title}
          />

          <Input
            label="Content"
            value={form.content}
            onChangeText={v => setForm(f => ({ ...f, content: v }))}
            placeholder="Write the full notice content here…"
            multiline
            numberOfLines={6}
            style={styles.contentInput}
            error={errors.content}
          />
        </View>

        {/* Type selector */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionLabel, { color: subtextColor }]}>NOTICE TYPE</Text>
          <View style={styles.typeRow}>
            {NOTICE_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.typeChip,
                  { borderColor: form.type === t.value ? t.color : borderColor },
                  form.type === t.value && { backgroundColor: `${t.color}18` },
                ]}
                onPress={() => setForm(f => ({ ...f, type: t.value }))}>
                <Text style={[styles.typeChipText, { color: form.type === t.value ? t.color : subtextColor }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Target audience */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionLabel, { color: subtextColor }]}>TARGET AUDIENCE</Text>
          {TARGET_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.targetRow,
                { borderColor: form.targetAudience === opt.value ? colors.primary : borderColor },
                form.targetAudience === opt.value && { backgroundColor: `${colors.primary}08` },
              ]}
              onPress={() => setForm(f => ({ ...f, targetAudience: opt.value }))}>
              <Text style={styles.targetIcon}>{opt.icon}</Text>
              <Text style={[styles.targetLabel, { color: textColor }]}>{opt.label}</Text>
              <View style={[styles.radio, { borderColor: form.targetAudience === opt.value ? colors.primary : borderColor }]}>
                {form.targetAudience === opt.value && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Attachments */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionLabel, { color: subtextColor }]}>ATTACHMENTS ({attachments.length}/5)</Text>

          {attachments.length > 0 && (
            <View style={styles.attachmentsList}>
              {attachments.map((att, i) => (
                <View key={i} style={[styles.attachmentItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor }]}>
                  {att.isImage && att.preview ? (
                    <Image source={{ uri: att.preview }} style={styles.attachmentPreview} />
                  ) : (
                    <View style={[styles.attachmentIconBox, { backgroundColor: `${colors.error}15` }]}>
                      <Text style={styles.attachmentTypeIcon}>📄</Text>
                    </View>
                  )}
                  <View style={styles.attachmentInfo}>
                    <Text style={[styles.attachmentName, { color: textColor }]} numberOfLines={1}>{att.name}</Text>
                    {att.size && (
                      <Text style={[styles.attachmentSize, { color: subtextColor }]}>
                        {(att.size / 1024).toFixed(1)} KB
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => removeAttachment(i)} style={styles.removeBtn}>
                    <Text style={{ color: colors.error, fontSize: 18 }}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {attachments.length < 5 && (
            <View style={styles.attachBtns}>
              <TouchableOpacity
                style={[styles.attachBtn, { borderColor, flex: 1 }]}
                onPress={handleAddImage}>
                <Text style={styles.attachBtnIcon}>🖼️</Text>
                <Text style={[styles.attachBtnText, { color: textColor }]}>Add Image</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.attachBtn, { borderColor, flex: 1 }]}
                onPress={handleAddPDF}>
                <Text style={styles.attachBtnIcon}>📄</Text>
                <Text style={[styles.attachBtnText, { color: textColor }]}>Add PDF</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={[styles.attachHint, { color: subtextColor }]}>
            Max 5 attachments · Images up to 5MB · PDFs up to 20MB
          </Text>
        </View>

        <Button
          title="Post Notice"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.submitBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  contentInput: { minHeight: 120, textAlignVertical: 'top' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 12 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5,
  },
  typeChipText: { fontSize: 13, fontWeight: '600' },
  targetRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 8,
  },
  targetIcon: { fontSize: 20 },
  targetLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  attachmentsList: { gap: 8, marginBottom: 12 },
  attachmentItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 10, borderRadius: 10, borderWidth: 1,
  },
  attachmentPreview: { width: 40, height: 40, borderRadius: 6 },
  attachmentIconBox: { width: 40, height: 40, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  attachmentTypeIcon: { fontSize: 20 },
  attachmentInfo: { flex: 1 },
  attachmentName: { fontSize: 12, fontWeight: '600' },
  attachmentSize: { fontSize: 11, marginTop: 2 },
  removeBtn: { padding: 4 },
  attachBtns: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  attachBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1, justifyContent: 'center',
  },
  attachBtnIcon: { fontSize: 18 },
  attachBtnText: { fontSize: 13, fontWeight: '600' },
  attachHint: { fontSize: 11, textAlign: 'center', marginTop: 4 },
  submitBtn: { marginTop: 4 },
});

export default CreateNoticeScreen;
