import { defaultProof, solverContent } from '../../stores/solverStore';
import { onChangeConclusion, onChangePremise } from '../solver/actions/proofActions';

export const loadDefaultValues = () => {
	solverContent.update((sc) => {
		sc.premises = defaultProof.premises;
		sc.conclusion = defaultProof.conclusion;
		return sc;
	});

	defaultProof.premises.forEach((premise, index) => {
		onChangePremise(premise.value, index);
	});

	onChangeConclusion(defaultProof.conclusion.value);
};
