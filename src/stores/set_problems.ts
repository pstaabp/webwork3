// This store handles set problems and user problems.

import { api } from 'boot/axios';
import { defineStore } from 'pinia';

import { ParseableProblem, parseProblem, SetProblem, ParseableSetProblem, UserProblem,
	mergeUserProblem, DBUserProblem, ParseableDBUserProblem } from 'src/common/models/problems';
import { UserSet } from 'src/common/models/user_sets';
import { useSessionStore } from 'src/stores/session';
import { useProblemSetStore } from './problem_sets';

export interface SetProblemsState {
	set_problems: SetProblem[];
	db_user_problems: DBUserProblem[];
}

type SetInfo =
	{ set_id: number; set_name?: never } |
	{ set_name?: string; set_id?: never };

export const useSetProblemStore = defineStore('set_problems', {
	state: (): SetProblemsState => ({
		set_problems: [],
		db_user_problems: []
	}),
	getters: {
		/**
		 * returns all set problems related to a given set.
		 * @param set_info either a set_id or set_name.
		 * @return an array of SetProblems from the given set or empty array if the set is not found.
		 */
		findSetProblems: (state) => (set_info: SetInfo): SetProblem[] => {
			if (set_info.set_id) {
				return state.set_problems.filter(prob => prob.set_id === set_info.set_id) as SetProblem[];
			} else if (set_info.set_name) {
				const problem_set_store = useProblemSetStore();
				const set = problem_set_store.problem_sets.find(set => set.set_name === set_info.set_name);
				if (set) {
					return state.set_problems.filter(prob => prob.set_id === set.set_id) as SetProblem[];
				} else {
					return [];
				}
			} else {
				return [];
			}
		},
		// Note: using standard function notation (not arrow) due to using this.
		/**
		 * Return the user problems with a given set_id, set_name
		 * @param set_info either a set_id or set_name.
		 * @returns an array of UserProblems for a given set or empty array if the set is not found.
		 */
		findUserProblems(state) {
			return (set_info: SetInfo) => {
				const problem_set_store = useProblemSetStore();
				// get a list of the desired problem_ids
				const problem_ids = this.findSetProblems(set_info).map(prob => prob.problem_id);
				return state.db_user_problems
					.filter(user_prob => problem_ids.findIndex(prob_id => user_prob.problem_id === prob_id) >= 0)
					.map(user_prob => {
						const user_set = problem_set_store.findUserSet({ user_set_id: user_prob.user_set_id })
							?? new UserSet();
						const set_problem = state.set_problems.find(prob => prob.problem_id === user_prob.problem_id)
							?? new SetProblem();
						// Not sure why the first two arguments need to be cast.
						return mergeUserProblem(set_problem as SetProblem, user_prob as DBUserProblem, user_set);
					});
			};
		},
		/**
		 * returns all user problems in the store merged with their corresponding set problems
		 * @returns an array of MergedUserProblems
		 */
		user_problems: (state) => {
			const problem_set_store = useProblemSetStore();
			return state.db_user_problems.map(user_problem => {
				const user_set = problem_set_store.findUserSet({ user_set_id: user_problem.user_set_id })
					?? new UserSet();
				const set_problem = state.set_problems.find(prob => prob.problem_id === user_problem.problem_id)
					?? new SetProblem();
				// Not sure why the first two arguments need to be cast.
				return mergeUserProblem(set_problem as SetProblem, user_problem as DBUserProblem, user_set);
			});
		}
	},
	actions: {
		/**
		 * fetch all set problems for a given course
		 * @param course_id - the database course id
		 */
		async fetchSetProblems(course_id: number): Promise<void> {
			const response = await api.get(`courses/${course_id}/problems`);
			const all_problems = response.data as Array<ParseableProblem>;
			this.set_problems = all_problems.map((prob) => parseProblem(prob, 'Set') as SetProblem);
		},
		/**
		 * adds a set problem to both the database and the store.
		 * @param {SetProblem} problem
		 * @returns the SetProblem that was added.
		 */
		async addSetProblem(problem: SetProblem): Promise<SetProblem> {
			const course_id = useSessionStore().course.course_id;
			const prob = problem.toObject();
			// delete the render params.  Not in the database.
			delete prob.render_params;
			const response = await api.post(`/courses/${course_id}/sets/${problem.set_id}/problems`, prob);

			// TODO: check for errors
			const new_problem = new SetProblem(response.data as ParseableSetProblem);
			this.set_problems.push(new_problem);
			return new_problem;
		},
		/**
		 * update a SetProblem in both the database and the store.
		 * @param {SetProblem} problem
		 * @returns the updated SetProblem
		 */
		async updateSetProblem(problem: SetProblem): Promise<SetProblem> {
			const course_id = useSessionStore().course.course_id;
			const prob = problem.toObject();
			// delete the render params.  Not in the database.
			delete prob.render_params;

			const response = await api.put(`courses/${course_id}/sets/${problem.set_id}/problems/${
				problem.problem_id}`, prob);
			const updated_problem = new SetProblem(response.data as ParseableSetProblem);
			// TODO: check for errors
			const index = this.set_problems.findIndex(prob => prob.problem_id === updated_problem.problem_id);
			this.set_problems.splice(index, 1, updated_problem);
			return updated_problem;
		},
		/**
		 * delete the SetProblem in both the store and the database.
		 * @param {SetProblem} problem
		 * @returns the deleted SetProblem
		 */
		async deleteSetProblem(problem: SetProblem): Promise<SetProblem> {
			const course_id = useSessionStore().course.course_id;

			const response = await api.delete(`courses/${course_id}/sets/${
				problem.set_id}/problems/${problem.problem_id}`);
			const deleted_problem = new SetProblem(response.data as ParseableSetProblem);
			// TODO: check for errors
			const index = this.set_problems.findIndex(prob => prob.problem_id === deleted_problem.problem_id);
			this.set_problems.splice(index, 1);
			return deleted_problem;
		},
		// UserProblem actions
		/**
		 * Fetch all user problems for a set in a course.
		 * @param {number} set_id the database id of the set.
		 */
		async fetchUserProblems(set_id: number) {
			const course_id = useSessionStore().course.course_id;
			const response = await api.get(`courses/${course_id}/sets/${set_id}/user-problems`);
			this.db_user_problems = (response.data as ParseableDBUserProblem[]).map(prob => new DBUserProblem(prob));
		},
		/**
		 * Fetch all user problems for a user in a course (stored in the session)
		 * @param {number} user_id - the database id of the user.
		 */
		async fetchUserProblemsForUser(user_id: number) {
			const course_id = useSessionStore().course.course_id;
			const response = await api.get(`courses/${course_id}/users/${user_id}/problems`);
			this.db_user_problems = (response.data as ParseableDBUserProblem[]).map(prob => new DBUserProblem(prob));
		},
		/**
		 * add a UserProblem to the database and the store.
		 * @param {UserProblem} user_problem
		 * @returns the UserProblem that was added.
		 */
		async addUserProblem(user_problem: UserProblem): Promise<UserProblem> {
			const course_id = useSessionStore().course.course_id;
			const set_problem = this.set_problems.find(prob => prob.problem_id === user_problem.problem_id);
			const user_set = useProblemSetStore().findUserSet({ user_set_id: user_problem.user_set_id });
			// TODO: handle if either set_problem or user_set undefined.

			const user_problem_params = user_problem.toObject();
			// The render params are not stored in the DB.
			delete user_problem_params.render_params;
			const response = await api.post(`courses/${course_id}/sets/${set_problem?.set_id ?? 0}/users/${
				user_set?.user_id ?? 0}/problems`, user_problem_params);
			const added_db_user_problem = new DBUserProblem(response.data as ParseableDBUserProblem);
			this.db_user_problems.push(added_db_user_problem);
			// Create a UserProblem to return from the current user problem and the saved
			// db_user_problem.
			const added_user_problem = new UserProblem(Object.assign(added_db_user_problem.toObject(),
				user_problem_params));
			return added_user_problem;
		},
		/**
		 * update a UserProblem in the database and the store.
		 * @param {UserProblem} user_problem
		 * @returns the UserProblem that was updated.
		 */
		 async updateUserProblem(user_problem: UserProblem): Promise<UserProblem> {
			const course_id = useSessionStore().course.course_id;
			const set_problem = this.set_problems.find(prob => prob.problem_id === user_problem.problem_id);
			const user_set = useProblemSetStore().findUserSet({ user_set_id: user_problem.user_set_id });
			// TODO: handle if either set_problem or user_set undefined.

			const user_problem_params = user_problem.toObject();
			// The render params are not stored in the DB.
			delete user_problem_params.render_params;
			const response = await api.put(`courses/${course_id}/sets/${set_problem?.set_id ?? 0}/users/${
				user_set?.user_id ?? 0}/problems/${user_problem.user_problem_id}`, user_problem_params);
			const updated_db_user_problem = new DBUserProblem(response.data as ParseableDBUserProblem);
			const index = this.db_user_problems
				.findIndex(user_problem => user_problem.user_problem_id === updated_db_user_problem.user_problem_id);
			this.db_user_problems.splice(index, 1, updated_db_user_problem);

			// Create a UserProblem to return from the current user problem and the saved
			// db_user_problem.
			const updated_user_problem = new UserProblem(Object.assign(updated_db_user_problem.toObject(),
				user_problem_params));
			return updated_user_problem;
		},
		/**
		 * delete a UserProblem from the database and the store.
		 * @param {UserProblem} user_problem
		 * @returns the deleted UserProblem.
		 */
		async deleteUserProblem(user_problem: UserProblem): Promise<UserProblem> {
			const course_id = useSessionStore().course.course_id;
			const set_problem = this.set_problems.find(prob => prob.problem_id === user_problem.problem_id);
			const problem_set_store = useProblemSetStore();
			const user_set = problem_set_store.findUserSet({ user_set_id: user_problem.user_set_id,  });
			if (user_set == undefined) {
				throw 'deleteUserProblem: returned undefined user set';
			}
			const response = await api.delete(`courses/${course_id}/sets/${set_problem?.set_id ?? 0
			}/users/${user_set.user_id}/problems/${user_problem.problem_id}`);
			const db_deleted_problem = new DBUserProblem(response.data as ParseableDBUserProblem);
			const index = this.db_user_problems
				.findIndex(user_problem => user_problem.user_problem_id === db_deleted_problem.user_problem_id);
			if (index >= 0) {
				this.db_user_problems.splice(index, 1);
			}
			// Create a new UserProblem to return as
			const deleted_user_problem = new UserProblem(Object.assign(db_deleted_problem.toObject(),
				user_problem.toObject()));
			return deleted_user_problem;
		}
	}
});
