import { NavigatorScreenParams } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type TabParamList = {
  Dashboard: undefined;
  Pets: undefined;
  Expenses: undefined;
  Health: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: NavigatorScreenParams<TabParamList>;
  PetDetail: { id: string; name?: string };
  PetForm: { mode: 'add' } | { mode: 'edit'; id: string };
  AddExpense: undefined;
  Reminders: undefined;
};

/** Use this on screens that live inside a tab AND need to push stack screens */
export type TabScreenNavProp<RouteName extends keyof TabParamList> =
  CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, RouteName>,
    NativeStackNavigationProp<RootStackParamList>
  >;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
