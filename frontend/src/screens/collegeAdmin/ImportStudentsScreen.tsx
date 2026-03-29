import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, Alert, FlatList,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../theme/colors';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import { api } from '../../services/api';

interface ImportResult {
  total: number;
  created: number;
  skipped: number;
  failed: number;
  details: Array<{
    row: number;
    email: string;
    name?: string;
    status: 'CREATED' | 'SKIPPED' | 'FAILED';
    reason?: string;
    studentId?: string;
  }>;
}

const statusColor = {
  CREATED: colors.success,
  SKIPPED: colors.warning,
  FAILED: colors.error,
};

const statusIcon = {
  CREATED: '✅',
  SKIPPED: '⏭️',
  FAILED: '❌',
};

const ImportStudentsScreen: React.FC<{ navigation: any; route: any }> = ({ navigation }) => {
  const { isDark } = useTheme();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showAll, setShowAll] = useState(false);

  const bg = isDark ? '#1A1A2E' : '#F8F9FD';
  const cardBg = isDark ? '#16213E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1A1A2E';
  const subtextColor = isDark ? '#A0A0B0' : '#666680';
  const borderColor = isDark ? '#2D2D4E' : '#E8E8F0';

  const handlePickFile = async () => {
    try {
      const picked = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.xls, DocumentPicker.types.xlsx],
        copyTo: 'cachesDirectory',
      });
      setSelectedFile(picked);
      setResult(null);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Toast.show({ type: 'error', text1: 'File Error', text2: 'Could not open file picker.' });
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      Toast.show({ type: 'info', text1: 'No file selected', text2: 'Please choose an Excel file first.' });
      return;
    }
    Alert.alert(
      'Confirm Import',
      `Import students from "${selectedFile.name}"?\n\nAccounts will be created and welcome emails with login credentials will be sent to each student.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: async () => {
            setIsImporting(true);
            try {
              const formData = new FormData();
              formData.append('file', {
                uri: selectedFile.fileCopyUri || selectedFile.uri,
                name: selectedFile.name,
                type: selectedFile.type,
              } as any);

              const response = await api.post('/students/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
              });

              const importResult: ImportResult = response.data?.data;
              setResult(importResult);
              Toast.show({
                type: importResult.created > 0 ? 'success' : 'info',
                text1: 'Import Complete',
                text2: `${importResult.created} created, ${importResult.skipped} skipped, ${importResult.failed} failed`,
              });
            } catch (err: any) {
              Toast.show({
                type: 'error',
                text1: 'Import Failed',
                text2: err?.response?.data?.message || 'Something went wrong.',
              });
            } finally {
              setIsImporting(false);
            }
          },
        },
      ]
    );
  };

  const visibleDetails = result
    ? showAll ? result.details : result.details.slice(0, 20)
    : [];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />
      <Header title="Import Students" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* How it works */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>How it works</Text>
          {[
            { icon: '1️⃣', text: 'Prepare an Excel file (.xlsx or .xls) with columns: name, email' },
            { icon: '2️⃣', text: 'Optional columns: rollNumber, year, semester, parentName, parentPhone, gender' },
            { icon: '3️⃣', text: 'Upload the file — accounts are created automatically' },
            { icon: '4️⃣', text: 'Each student receives a welcome email with their login credentials' },
          ].map((step, i) => (
            <View key={i} style={styles.step}>
              <Text style={styles.stepIcon}>{step.icon}</Text>
              <Text style={[styles.stepText, { color: subtextColor }]}>{step.text}</Text>
            </View>
          ))}
        </View>

        {/* Required columns */}
        <View style={[styles.card, { backgroundColor: 'rgba(108,99,255,0.08)', borderColor: colors.primary }]}>
          <Text style={[styles.cardTitle, { color: colors.primary }]}>Required Excel Columns</Text>
          <View style={styles.columnsGrid}>
            {['name ✱', 'email ✱', 'rollNumber', 'year', 'semester', 'gender', 'parentName', 'parentPhone'].map((col) => (
              <View key={col} style={[styles.colTag, { backgroundColor: col.includes('✱') ? `${colors.primary}20` : isDark ? '#ffffff10' : '#00000008' }]}>
                <Text style={[styles.colTagText, { color: col.includes('✱') ? colors.primary : subtextColor }]}>{col}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.requiredNote, { color: subtextColor }]}>✱ Required columns</Text>
        </View>

        {/* File Picker */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>Select Excel File</Text>

          <TouchableOpacity
            style={[styles.dropZone, { borderColor: selectedFile ? colors.primary : borderColor, backgroundColor: selectedFile ? `${colors.primary}08` : 'transparent' }]}
            onPress={handlePickFile}
            activeOpacity={0.7}>
            {selectedFile ? (
              <View style={styles.fileSelected}>
                <Text style={styles.fileIcon}>📊</Text>
                <Text style={[styles.fileName, { color: textColor }]} numberOfLines={2}>{selectedFile.name}</Text>
                <Text style={[styles.fileSize, { color: subtextColor }]}>
                  {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''}
                </Text>
                <Text style={[styles.changeFile, { color: colors.primary }]}>Tap to change file</Text>
              </View>
            ) : (
              <View style={styles.dropZoneContent}>
                <Text style={styles.dropIcon}>📁</Text>
                <Text style={[styles.dropTitle, { color: textColor }]}>Tap to select Excel file</Text>
                <Text style={[styles.dropSub, { color: subtextColor }]}>Supports .xlsx and .xls formats</Text>
              </View>
            )}
          </TouchableOpacity>

          <Button
            title={isImporting ? 'Importing…' : 'Import Students'}
            onPress={handleImport}
            loading={isImporting}
            disabled={!selectedFile || isImporting}
            style={styles.importBtn}
          />
        </View>

        {/* Results */}
        {result && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.cardTitle, { color: textColor }]}>Import Results</Text>

            {/* Summary */}
            <View style={styles.summaryRow}>
              {[
                { label: 'Created', value: result.created, color: colors.success, icon: '✅' },
                { label: 'Skipped', value: result.skipped, color: colors.warning, icon: '⏭️' },
                { label: 'Failed', value: result.failed, color: colors.error, icon: '❌' },
              ].map((stat) => (
                <View key={stat.label} style={[styles.summaryCard, { backgroundColor: `${stat.color}12`, borderColor: `${stat.color}30` }]}>
                  <Text style={styles.summaryIcon}>{stat.icon}</Text>
                  <Text style={[styles.summaryValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={[styles.summaryLabel, { color: subtextColor }]}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.totalText, { color: subtextColor }]}>
              Total rows processed: {result.total}
            </Text>

            {/* Detail Rows */}
            {result.details.length > 0 && (
              <>
                <Text style={[styles.detailTitle, { color: textColor }]}>Row Details</Text>
                {visibleDetails.map((item, i) => (
                  <View key={i} style={[styles.detailRow, { borderBottomColor: borderColor }]}>
                    <Text style={[styles.detailRowNum, { color: subtextColor }]}>Row {item.row}</Text>
                    <View style={styles.detailRowInfo}>
                      <Text style={[styles.detailRowEmail, { color: textColor }]} numberOfLines={1}>{item.email}</Text>
                      {item.reason && <Text style={[styles.detailRowReason, { color: subtextColor }]}>{item.reason}</Text>}
                    </View>
                    <View style={[styles.detailStatus, { backgroundColor: `${statusColor[item.status]}15` }]}>
                      <Text style={{ fontSize: 12 }}>{statusIcon[item.status]}</Text>
                      <Text style={[styles.detailStatusText, { color: statusColor[item.status] }]}>{item.status}</Text>
                    </View>
                  </View>
                ))}
                {result.details.length > 20 && (
                  <TouchableOpacity onPress={() => setShowAll(!showAll)} style={styles.showMoreBtn}>
                    <Text style={[styles.showMoreText, { color: colors.primary }]}>
                      {showAll ? 'Show less' : `Show all ${result.details.length} rows`}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  step: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  stepIcon: { fontSize: 16 },
  stepText: { flex: 1, fontSize: 13, lineHeight: 18 },
  columnsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  colTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  colTagText: { fontSize: 12, fontWeight: '600' },
  requiredNote: { fontSize: 11, marginTop: 4 },
  dropZone: {
    borderWidth: 2, borderStyle: 'dashed', borderRadius: 12,
    padding: 24, alignItems: 'center', marginBottom: 16,
  },
  dropZoneContent: { alignItems: 'center', gap: 8 },
  dropIcon: { fontSize: 40 },
  dropTitle: { fontSize: 16, fontWeight: '600' },
  dropSub: { fontSize: 13 },
  fileSelected: { alignItems: 'center', gap: 6 },
  fileIcon: { fontSize: 40 },
  fileName: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  fileSize: { fontSize: 12 },
  changeFile: { fontSize: 12, fontWeight: '500', marginTop: 4 },
  importBtn: { marginTop: 4 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  summaryCard: {
    flex: 1, alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1,
  },
  summaryIcon: { fontSize: 20, marginBottom: 4 },
  summaryValue: { fontSize: 24, fontWeight: '800' },
  summaryLabel: { fontSize: 11, marginTop: 2 },
  totalText: { fontSize: 12, marginBottom: 16, textAlign: 'center' },
  detailTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, borderBottomWidth: 1,
  },
  detailRowNum: { fontSize: 11, width: 40 },
  detailRowInfo: { flex: 1 },
  detailRowEmail: { fontSize: 13, fontWeight: '600' },
  detailRowReason: { fontSize: 11, marginTop: 2 },
  detailStatus: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  detailStatusText: { fontSize: 10, fontWeight: '700' },
  showMoreBtn: { alignItems: 'center', paddingVertical: 12 },
  showMoreText: { fontSize: 13, fontWeight: '600' },
});

export default ImportStudentsScreen;
