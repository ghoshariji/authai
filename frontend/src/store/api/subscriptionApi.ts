import { baseApi } from './baseApi';
import { Subscription, SubscriptionPlan } from '../../types';

interface SubscribeRequest {
  plan: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  paymentToken?: string;
}

export const subscriptionApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getPlans: builder.query<SubscriptionPlan[], void>({
      query: () => '/subscriptions/plans',
    }),
    getCurrentSubscription: builder.query<Subscription, void>({
      query: () => '/subscriptions/current',
      providesTags: ['Subscription'],
    }),
    subscribe: builder.mutation<Subscription, SubscribeRequest>({
      query: data => ({
        url: '/subscriptions/subscribe',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Subscription'],
    }),
    upgradePlan: builder.mutation<Subscription, { plan: string; billingCycle: string }>({
      query: data => ({
        url: '/subscriptions/upgrade',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Subscription'],
    }),
    cancelSubscription: builder.mutation<void, void>({
      query: () => ({
        url: '/subscriptions/cancel',
        method: 'POST',
      }),
      invalidatesTags: ['Subscription'],
    }),
  }),
});

export const {
  useGetPlansQuery,
  useGetCurrentSubscriptionQuery,
  useSubscribeMutation,
  useUpgradePlanMutation,
  useCancelSubscriptionMutation,
} = subscriptionApi;
