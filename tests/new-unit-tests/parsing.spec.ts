// This tests the parsing of various formats

import { parseNonNegInt, parseBoolean, parseEmail, parseUsername, EmailParseException,
	NonNegIntException, BooleanParseException, UsernameParseException,
	parseUserRole, UserRoleException } from 'src/common/models/parsers';

test('parsing nonnegative integers', () => {
	expect(parseNonNegInt(1)).toBe(1);
	expect(parseNonNegInt('1')).toBe(1);
	expect(parseNonNegInt(0)).toBe(0);
	expect(parseNonNegInt('0')).toBe(0);
	expect(() => {parseNonNegInt(-1);}).toThrow(NonNegIntException);
	expect(() => {parseNonNegInt('-1');}).toThrow(NonNegIntException);
});

test('parsing booleans', () => {
	expect(parseBoolean(true)).toBe(true);
	expect(parseBoolean(false)).toBe(false);
	expect(parseBoolean('true')).toBe(true);
	expect(parseBoolean('false')).toBe(false);
	expect(parseBoolean(1)).toBe(true);
	expect(parseBoolean(0)).toBe(false);
	expect(parseBoolean('1')).toBe(true);
	expect(parseBoolean('0')).toBe(false);
	expect(() => {parseBoolean('T');}).toThrow(BooleanParseException);
	expect(() => {parseBoolean('F');}).toThrow(BooleanParseException);
	expect(() => {parseBoolean('-1');}).toThrow(BooleanParseException);
	expect(() => {parseBoolean(-1);}).toThrow(BooleanParseException);
});

test('parsing emails', () => {
	expect(parseEmail('user@site.com')).toBe('user@site.com');
	expect(parseEmail('first.last@site.com')).toBe('first.last@site.com');
	expect(parseEmail('user1234@site.com')).toBe('user1234@site.com');
	expect(parseEmail('first.last@sub.site.com')).toBe('first.last@sub.site.com');
	expect(() => {parseEmail('first last@site.com');}).toThrow(EmailParseException);
});

test('parsing usernames', () => {
	expect(parseUsername('login')).toBe('login');
	expect(parseUsername('login123')).toBe('login123');
	expect(() => {parseUsername('@login');}).toThrow(UsernameParseException);
	expect(() => {parseUsername('1234login');}).toThrow(UsernameParseException);

	expect(parseUsername('user@site.com')).toBe('user@site.com');
	expect(parseUsername('first.last@site.com')).toBe('first.last@site.com');
	expect(parseUsername('user1234@site.com')).toBe('user1234@site.com');
	expect(parseUsername('first.last@sub.site.com')).toBe('first.last@sub.site.com');
	expect(() => {parseUsername('first last@site.com');}).toThrow(UsernameParseException);

});

test('parsing user roles', () => {
	expect(parseUserRole('instructor')).toBe('instructor');
	expect(parseUserRole('TA')).toBe('TA');
	expect(parseUserRole('student')).toBe('student');
	expect(() => {parseUserRole('not_existent'); }).toThrow(UserRoleException);
});
