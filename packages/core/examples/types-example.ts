import type {
  RowData,
  ColumnId,
  RowId,
  AccessorValue,
  RequireKeys,
  DeepPartial,
  Updater,
  Listener,
  Unsubscribe,
  Comparator,
  Predicate,
} from '../src/types/base';

// Example 1: RowData with complex nested structure
interface User extends RowData {
  id: string;
  name: string;
  email: string;
  profile: {
    avatar: string;
    bio: string;
    settings: {
      theme: 'light' | 'dark';
      notifications: boolean;
    };
  };
  tags: string[];
  metadata: {
    created: Date;
    updated: Date;
  };
}

// Example 2: Using ColumnId with dot notation
const userIdColumn: ColumnId = 'id';
const userNameColumn: ColumnId = 'name';
const userAvatarColumn: ColumnId = 'profile.avatar';
const userThemeColumn: ColumnId = 'profile.settings.theme';

// Example 3: Using RowId
const stringRowId: RowId = 'user-123';
const numberRowId: RowId = 456;

// Example 4: AccessorValue type inference
type UserName = AccessorValue<User, 'name'>; // string
type UserAvatar = AccessorValue<User, 'profile.avatar'>; // string
type UserTheme = AccessorValue<User, 'profile.settings.theme'>; // 'light' | 'dark'
type UserTags = AccessorValue<User, 'tags'>; // string[]
type InvalidAccessor = AccessorValue<User, 'invalid'>; // unknown

// Example 5: RequireKeys
interface OptionalConfig {
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

type RequiredConfig = RequireKeys<OptionalConfig, 'timeout'>;
// { timeout: number; retries?: number; debug?: boolean }

// Example 6: DeepPartial
const partialUser: DeepPartial<User> = {
  name: 'John',
  profile: {
    settings: {
      theme: 'dark',
    },
  },
  // tags and metadata are optional
};

// Example 7: Updater
const countUpdater: Updater<number> = 42;
const countFunctionUpdater: Updater<number> = (prev) => prev + 1;

// Example 8: Listener
const stateListener: Listener<User> = (user) => {
  console.log(`User updated: ${user.name}`);
};

// Example 9: Unsubscribe
const unsubscribe: Unsubscribe = () => {
  console.log('Unsubscribed');
};

// Example 10: Comparator
const numericComparator: Comparator<number> = (a, b) => a - b;
const userComparator: Comparator<User> = (a, b) => a.name.localeCompare(b.name);

// Example 11: Predicate
const isActiveUser: Predicate<User> = (user) => user.email.includes('@');
const hasDarkTheme: Predicate<User> = (user) =>
  user.profile.settings.theme === 'dark';

// Type assertions to verify inference
const assertUserName: UserName = 'John Doe';
const assertUserTheme: UserTheme = 'light';
const assertPartialUser: DeepPartial<User> = {};

console.log('All type examples are valid!');
