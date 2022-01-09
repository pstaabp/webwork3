import { api } from 'boot/axios';
import type { Commit } from 'vuex';
import type { StateInterface } from '../index';

import { parseProblemSet, ProblemSet, ParseableProblemSet } from 'src/common/models/problem_sets';
import { MergedUserSet, ParseableMergedUserSet, parseMergedUserSet, UserSet } from 'src/common/models/user_sets';
import { LibraryProblem, SetProblem, ParseableProblem, parseProblem,
	ParseableSetProblem, UserProblem } from 'src/common/models/problems';

export interface ProblemSetState {
	problem_sets: Array<ProblemSet>;
	set_problems: Array<SetProblem>;
	merged_user_sets: Array<MergedUserSet>;
	user_problems: Array<UserProblem>;
}

const initial_state = {
	problem_sets: [],
	set_problems: [],
	merged_user_sets: [],
	user_problems: [],
};

export default {
	namespaced: true,
	state: initial_state,
	getters: {
		problem_sets(state: ProblemSetState): Array<ProblemSet> {
			return state.problem_sets;
		},
		set_problems(state: ProblemSetState): Array<SetProblem> {
			return state.set_problems;
		},
		merged_user_sets(state: ProblemSetState): Array<MergedUserSet> {
			return state.merged_user_sets;
		},
		user_problems(state: ProblemSetState): Array<UserProblem> {
			return state.user_problems;
		}
	},
	actions: {
		async fetchProblemSets({ commit, rootState }: { commit: Commit; rootState: StateInterface }): Promise<void> {
			const course_id = rootState.session.course.course_id;
			const response = await api.get(`courses/${course_id}/sets`);
			const _sets_to_parse = response.data as Array<ParseableProblemSet>;
			commit('SET_PROBLEM_SETS', _sets_to_parse.map((set) => parseProblemSet(set)));
		},
		async updateSet({ commit, rootState }: { commit: Commit; rootState: StateInterface },
			_set: ProblemSet): Promise<ProblemSet> {
			const course_id = rootState.session.course.course_id;
			// shouldn't we be throwing an error if set_id is null or 0?
			const response = await api.put(`courses/${course_id}/sets/${_set.set_id ?? 0}`, _set.toObject());
			const set = response.data as ProblemSet;
			// The following is not working.  TODO: fix-me
			// if (JSON.stringify(set) === JSON.stringify(_set)) {
			// commit('UPDATE_PROBLEM_SET', _set);
			// } else {
			// logger.error(`Problem set #${_set.set_id ?? 0} failed to update properly.`);
			// }
			commit('UPDATE_PROBLEM_SET', _set);
			return set;
		},
		async fetchSetProblems({ commit, rootState }: { commit: Commit; rootState: StateInterface }): Promise<void> {
			const course_id = rootState.session.course.course_id;
			const response = await api.get(`courses/${course_id}/problems`);
			const all_problems = response.data as Array<ParseableProblem>;
			commit('SET_PROBLEMS', all_problems.map((prob) => parseProblem(prob, 'Set')));
		},
		async addSetProblem({ commit }: { commit: Commit },
			problem_info: { course_id: number, set_id: number, problem: LibraryProblem }): Promise<void> {

			const url = `/courses/${problem_info.course_id}/sets/${problem_info.set_id}/problems`;
			const response = await api.post(url, {
				problem_params: problem_info.problem.location_params.toObject()
			});
			const problem = response.data as ParseableSetProblem;
			// TODO: check for errors
			commit('ADD_SET_PROBLEM', new SetProblem(problem));
		},
		async updateSetProblem({ commit, rootState }: { commit: Commit; rootState: StateInterface },
			params: { set_id: number, problem_id: number, props: ParseableProblem}): Promise<void> {
			const course_id = rootState.session.course.course_id;
			const url = `courses/${course_id}/sets/${params.set_id}/problems/${params.problem_id ?? 0}`;
			const response = await api.put(url, params.props);
			const problem = response.data as ParseableSetProblem;
			// TODO: check for errors
			commit('UPDATE_SET_PROBLEM', new SetProblem(problem));
		},
		async deleteSetProblem({ commit, rootState }: { commit: Commit; rootState: StateInterface },
			problem: SetProblem): Promise<void> {
			const course_id = rootState.session.course.course_id;
			const url = `courses/${course_id}/sets/${problem.set_id ?? 0}/problems/${problem.problem_id ?? 0}`;
			const response = await api.delete(url);
			const _problem = response.data as ParseableSetProblem;
			// TODO: check for errors
			commit('DELETE_SET_PROBLEM', new SetProblem(_problem));
		},
		async fetchCourseMergedUserSets({ commit, rootState }: { commit: Commit; rootState: StateInterface },
			set_id: number): Promise<void> {
			const course_id = rootState.session.course.course_id;
			// console.log(rootState.session);
			const url = `courses/${course_id}/sets/${set_id}/users`;
			// console.log(url);
			const response = await api.get(url);
			const user_sets = response.data as Array<ParseableMergedUserSet>;

			// TODO: check for errors
			commit('SET_MERGED_USER_SETS', user_sets.map(_set => new MergedUserSet(_set)));
		},
		async fetchUserMergedUserSets({ commit, rootState }: { commit: Commit; rootState: StateInterface },
			user_id: number): Promise<void> {
			const course_id = rootState.session.course.course_id;
			const url = `courses/${course_id}/users/${user_id}/sets`;
			const response = await api.get(url);
			const user_sets = response.data as Array<ParseableMergedUserSet>;
			// TODO: check for errors
			commit('SET_MERGED_USER_SETS', user_sets.map(_set => parseMergedUserSet(_set)));
		},
		async addUserSet({ commit, rootState }: { commit: Commit; rootState: StateInterface },
			user_set: UserSet) {
			const course_id = rootState.session.course.course_id;
			const url = `courses/${course_id}/sets/${user_set.set_id ?? 0}/users`;
			const response = await api.post(url, user_set.toObject());
			const updated_user_set = response.data as ParseableMergedUserSet;
			// TODO: check for errors
			commit('ADD_MERGED_USER_SET', parseMergedUserSet(updated_user_set));
		},
		async updateUserSet({ commit, rootState }: { commit: Commit; rootState: StateInterface },
			_set: UserSet) {
			const course_id = rootState.session.course.course_id;
			const url = `courses/${course_id}/sets/${_set.set_id ?? 0}/users/${_set.course_user_id ?? 0}`;
			const response = await api.put(url, _set.toObject());
			const updated_user_set = response.data as ParseableMergedUserSet;
			// TODO: check for errors
			commit('UPDATE_MERGED_USER_SET', parseMergedUserSet(updated_user_set));
		},
		async deleteUserSet({ commit, rootState }: { commit: Commit; rootState: StateInterface },
			user_set: UserSet) {
			const course_id = rootState.session.course.course_id;
			const url = `courses/${course_id}/sets/${user_set.set_id ?? 0}/users/${user_set.course_user_id ?? 0}`;
			const response = await api.delete(url);
			const updated_user_set = response.data as ParseableMergedUserSet;
			// TODO: check for errors
			const deleted_merged_user_set = new MergedUserSet(updated_user_set);
			commit('DELETE_MERGED_USER_SET', deleted_merged_user_set);
			return deleted_merged_user_set;
		},
		async fetchUserProblems({ commit, rootState }: { commit: Commit; rootState: StateInterface },
			user_id: number) {
			const course_id = rootState.session.course.course_id;
			const url = `courses/${course_id}/users/${user_id}/problems`;
			const response = await api.get(url);
			const user_problems = response.data as Array<ParseableUserProblem>;
			// TODO: check for errors
			commit('SET_USER_PROBLEMS', user_problems.map(_problem => new UserProblem(_problem)));
		},
		// This clears out all data for use during logout.
		clearSets({ commit }: { commit: Commit }): void {
			commit('SET_PROBLEM_SETS', []);
			commit('SET_PROBLEMS', []);
			commit('SET_MERGED_USER_SETS', []);
		}
	},
	mutations: {
		SET_PROBLEM_SETS(state: ProblemSetState, _problem_sets: Array<ProblemSet>): void {
			state.problem_sets = _problem_sets;
		},
		UPDATE_PROBLEM_SET(state: ProblemSetState, _set: ProblemSet): void {
			const index = state.problem_sets.findIndex((s: ProblemSet) => s.set_id === _set.set_id);
			state.problem_sets[index] = _set;
		},
		SET_PROBLEMS(state: ProblemSetState, _set_problems: Array<SetProblem>): void {
			state.set_problems = _set_problems;
		},
		ADD_SET_PROBLEM(state: ProblemSetState, _problem: SetProblem): void {
			state.set_problems.push(_problem);
		},
		UPDATE_SET_PROBLEM(state: ProblemSetState, _problem: SetProblem): void {
			const index = state.set_problems.findIndex(prob => prob.problem_id === _problem.problem_id);
			state.set_problems[index] = _problem;
		},
		DELETE_SET_PROBLEM(state: ProblemSetState, _problem: SetProblem): void {
			const index = state.set_problems.findIndex(prob => prob.problem_id === _problem.problem_id);
			state.set_problems.splice(index, 1);
		},
		SET_MERGED_USER_SETS(state: ProblemSetState, _merged_user_sets: Array<MergedUserSet>): void {
			state.merged_user_sets = _merged_user_sets;
		},
		ADD_MERGED_USER_SET(state: ProblemSetState, _user_set: MergedUserSet) {
			state.merged_user_sets.push(_user_set);
		},
		UPDATE_MERGED_USER_SET(state: ProblemSetState, _user_set: MergedUserSet) {
			const index = state.merged_user_sets
				.findIndex((s: MergedUserSet) => s.course_user_id === _user_set.course_user_id);
			state.merged_user_sets.splice(index, 1, _user_set);
		},
		DELETE_MERGED_USER_SET(state: ProblemSetState, _user_set: MergedUserSet) {
			const index = state.merged_user_sets
				.findIndex((s: MergedUserSet) => s.course_user_id === _user_set.course_user_id);
			state.merged_user_sets.splice(index, 1);
		},
		SET_USER_PROBLEMS(state: ProblemSetState, _problems: Array<UserProblem>): void {
			state.user_problems = _problems;
		},
	}
};
