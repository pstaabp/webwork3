import { api } from 'boot/axios';

import { ParseableCourseUser, ParseableUser } from 'src/common/models/users';
import { ResponseError } from 'src/common/api-requests/interfaces';

/**
 * Checks if a global user exists with given course_id and username.
 */

export async function checkIfUserExists(course_id: number, username: string) {
	const response = await api.get(`courses/${course_id}/users/${username}/exists`);
	return response.data as ParseableCourseUser;
}

/**
 * Gets the global user in the database given by username. This returns a user or throws a
 * ResponseError if the user is not found.
 */
export async function getUser(username: string): Promise<ParseableUser> {
	const response = await api.get(`users/${username}`);
	if (response.status === 200) {
		return response.data as ParseableUser;
	} else {
		throw response.data as ResponseError;
	}
}
