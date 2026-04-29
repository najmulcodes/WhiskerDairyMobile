import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Auth: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Pets: undefined;
  Expenses: undefined;
  Health: undefined;
  Settings: undefined;
};

export type PetsStackParamList = {
  PetsList: undefined;
  PetDetail: { id: string; name?: string };
  PetForm: { mode: 'add' } | { mode: 'edit'; id: string };
};

export type ExpensesStackParamList = {
  ExpensesList: undefined;
  AddExpense: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  PetDetail: { id: string; name?: string };
  PetForm: { mode: 'add' } | { mode: 'edit'; id: string };
  AddExpense: undefined;
  Reminders: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
