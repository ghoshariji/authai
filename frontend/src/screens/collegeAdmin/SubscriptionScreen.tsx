import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useGetCurrentSubscriptionQuery, useGetPlansQuery, useUpgradePlanMutation } from '../../store/api/subscriptionApi';
import { useGetCollegeStatsQuery } from '../../store/api/collegeApi';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import Header from '../../components/common/Header';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { getPlanColor, formatDate, formatCurrency } from '../../utils/helpers';
import { PLAN_PRICES } from '../../utils/constants';
import { PlanType } from '../../types';

const PLAN_FEATURES: Record<PlanType, string[]> = {
  FREE: ['Up to 50 students', '5 teachers', '2 departments', 'Basic reports'],
  BASIC: ['Up to 200 students', '20 teachers', '5 departments', 'Advanced reports', 'Email support'],
  PRO: ['Up to 1000 students', '100 teachers', '20 departments', 'Full analytics', 'Priority support', 'API access'],
  ENTERPRISE: ['Unlimited students', '500 teachers', '100 departments', 'Custom integrations', '24/7 support', 'SLA guarantee'],
};

const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const [confirmPlan, setConfirmPlan] = useState<PlanType | null>(null);

  const { data: subscription, isLoading: subLoading } = useGetCurrentSubscriptionQuery();
  const { data: plans } = useGetPlansQuery();
  const { data: stats } = useGetCollegeStatsQuery();
  const [upgradePlan, { isLoading: upgrading }] = useUpgradePlanMutation();

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const handleUpgrade = async () => {
    if (!confirmPlan) return;
    try {
      await upgradePlan({ plan: confirmPlan, billingCycle: 'MONTHLY' }).unwrap();
      Toast.show({ type: 'success', text1: 'Plan upgraded successfully!' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.data?.message || 'Failed to upgrade plan' });
    }
    setConfirmPlan(null);
  };

  if (subLoading) return <Loader fullScreen isDark={isDark} />;

  const allPlans: PlanType[] = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
  const currentPlan = subscription?.plan ?? 'FREE';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <Header title="Subscription" onBack={() => navigation.goBack()} isDark={isDark} />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Current Plan */}
        <View style={[styles.currentPlanCard, { backgroundColor: `${getPlanColor(currentPlan)}20`, borderColor: getPlanColor(currentPlan) }]}>
          <View style={styles.currentPlanHeader}>
            <View>
              <Text style={[styles.currentPlanLabel, { color: secondaryColor }]}>Current Plan</Text>
              <Text style={[styles.currentPlanName, { color: getPlanColor(currentPlan) }]}>{currentPlan}</Text>
            </View>
            <Badge
              label={subscription?.status ?? 'ACTIVE'}
              backgroundColor={subscription?.status === 'ACTIVE' ? colors.success : colors.warning}
            />
          </View>
          {subscription && (
            <Text style={[styles.renewDate, { color: secondaryColor }]}>
              Renews: {formatDate(subscription.currentPeriodEnd)}
            </Text>
          )}
          {/* Usage Stats */}
          {stats && (
            <View style={styles.usage}>
              {[
                { label: 'Students', used: stats.totalStudents, limit: subscription?.limits.students ?? 50 },
                { label: 'Teachers', used: stats.totalTeachers, limit: subscription?.limits.teachers ?? 5 },
              ].map(u => {
                const pct = Math.min((u.used / u.limit) * 100, 100);
                return (
                  <View key={u.label} style={styles.usageItem}>
                    <View style={styles.usageRow}>
                      <Text style={[styles.usageLabel, { color: textColor }]}>{u.label}</Text>
                      <Text style={[styles.usageCount, { color: pct > 80 ? colors.error : textColor }]}>
                        {u.used}/{u.limit}
                      </Text>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: isDark ? colors.border.dark : '#E0E0E0' }]}>
                      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: pct > 80 ? colors.error : getPlanColor(currentPlan) }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Plans */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Available Plans</Text>
        {allPlans.map(plan => {
          const isCurrent = plan === currentPlan;
          const price = PLAN_PRICES[plan];
          const features = PLAN_FEATURES[plan];
          const planColor = getPlanColor(plan);

          return (
            <View
              key={plan}
              style={[
                styles.planCard,
                { backgroundColor: cardBg, borderColor: isCurrent ? planColor : 'transparent', borderWidth: isCurrent ? 2 : 0 },
                shadow.sm,
              ]}>
              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planName, { color: planColor }]}>{plan}</Text>
                  <Text style={[styles.planPrice, { color: textColor }]}>
                    {price === 0 ? 'Free' : `${formatCurrency(price)}/mo`}
                  </Text>
                </View>
                {isCurrent ? (
                  <Badge label="Current" backgroundColor={planColor} />
                ) : (
                  <TouchableOpacity
                    style={[styles.selectBtn, { backgroundColor: planColor }]}
                    onPress={() => setConfirmPlan(plan)}>
                    <Text style={styles.selectBtnText}>{PLAN_PRICES[plan] > PLAN_PRICES[currentPlan] ? 'Upgrade' : 'Downgrade'}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.featuresList}>
                {features.map(f => (
                  <View key={f} style={styles.featureRow}>
                    <Text style={{ color: colors.success, fontSize: 14, marginRight: spacing[2] }}>✓</Text>
                    <Text style={[styles.featureText, { color: secondaryColor }]}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        <View style={{ height: spacing[8] }} />
      </ScrollView>

      <ConfirmDialog
        visible={!!confirmPlan}
        title={`${PLAN_PRICES[confirmPlan ?? 'FREE'] > PLAN_PRICES[currentPlan] ? 'Upgrade' : 'Change'} to ${confirmPlan}`}
        message={`You will be charged ${formatCurrency(PLAN_PRICES[confirmPlan ?? 'FREE'])}/month. Continue?`}
        confirmLabel="Confirm"
        onConfirm={handleUpgrade}
        onCancel={() => setConfirmPlan(null)}
        isDark={isDark}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  currentPlanCard: {
    margin: spacing[5],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 2,
  },
  currentPlanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[2] },
  currentPlanLabel: { fontSize: fontSize.sm },
  currentPlanName: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  renewDate: { fontSize: fontSize.xs, marginBottom: spacing[4] },
  usage: { gap: spacing[3] },
  usageItem: {},
  usageRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[1] },
  usageLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  usageCount: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, paddingHorizontal: spacing[5], marginBottom: spacing[3] },
  planCard: {
    marginHorizontal: spacing[5],
    marginBottom: spacing[4],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
  },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] },
  planName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  planPrice: { fontSize: fontSize.sm, marginTop: 2 },
  selectBtn: { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: borderRadius.md },
  selectBtnText: { color: '#FFFFFF', fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  featuresList: { gap: spacing[2] },
  featureRow: { flexDirection: 'row', alignItems: 'center' },
  featureText: { fontSize: fontSize.sm },
});

export default SubscriptionScreen;
