/**
 * ButtonContent interface
 * This interface is used to define the structure of the button content object
 * @param action: () => void - function to be executed when button is clicked
 * @param text: string - text to be displayed on button
 */
export interface ButtonContent {
	action: () => void;
	text: string;
}
