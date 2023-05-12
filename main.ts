import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, moment, SuggestModal } from 'obsidian';

// Remember to rename these classes and interfaces!

var lastEditDateLine = 8;
var lastEditDateCh = 13;
var lastEditDateStr = "updatedDate:"

var dateFormat = "YYYY-MM-DD";

var nameListTitle = "nameList";
var nameListSplitStr = ",";

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}


// suggestion modal

export class SuggestionModal extends SuggestModal<string> {

	editor: Editor;
	suggestionList: string[];

	constructor(editor: Editor, suggestionList: string[]) {
		super(app);
		this.editor = editor;
		this.suggestionList = suggestionList;
		
	}

	getSuggestions(query: string): string[] {
		return this.suggestionList.filter(
			(item) => item.toLowerCase().includes(query.toLowerCase())
		)
	}
	renderSuggestion(item: string, el: HTMLElement) {
		el.createEl("div", { text: item });
	}
	onChooseSuggestion(item: string, evt: MouseEvent | KeyboardEvent) {
		this.editor.replaceRange(item, this.editor.getCursor());
	}
}


export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		
		// adding quick text (opening suggestion modal) but double clicking on the same line as keywords

		this.registerDomEvent(document, 'dblclick', (evt: MouseEvent) => {
			if (this.app.workspace.activeEditor == null || this.app.workspace.activeEditor.editor == null) {
				return;
			}
			let editor = this.app.workspace.activeEditor!.editor!;
			let pathToLocate: string = "";
			let keywordFound = false;
			if (editor.getLine(editor.getCursor().line).startsWith(peopleStr)) {
				pathToLocate = peopleListFilePath;
				keywordFound = true;
			} else if (editor.getLine(editor.getCursor().line).startsWith(typeStr)) {
				pathToLocate = typeListFilePath;
				keywordFound = true;
			}
			if (keywordFound) {
				const files: TFile[] = this.app.vault.getMarkdownFiles();
				for (let index = 0; index < files.length; index++) {
					if (files[index].path.localeCompare(pathToLocate) == 0) {
						this.app.vault.read(files[index]).then((value) => {
							let suggestionList: string[] = value.split(suggestionSplitStr);
							new SuggestionModal(editor, suggestionList).open();
						})
					}
				}
			}
		});
	
		// adding people (opening suggestion modal) anywhere on the editor through ribbon icon

		const ribbonIconAddPeople = this.addRibbonIcon('user', 'Add People', (evt: MouseEvent) => {
			if (this.app.workspace.activeEditor == null || this.app.workspace.activeEditor.editor == null) {
				return;
			}
			let editor = this.app.workspace.activeEditor!.editor!;
			const files: TFiles[] = this.app.vault.getMarkdownFiles();
			for (let index = 0; index < files.length; index++) {
				if (files[index].path.localeCompare(peopleListFilePath) == 0) {
					this.app.vault.read(files[index]).then((value) => {
						let nameList: string[] = value.split('\n');
						new SuggestionModal(editor, nameList).open();
					})
				}
			}
		});

		// insert date at cursor place and replace latest edit date through ribbon icon

		const ribbonIconInsertDate = this.addRibbonIcon('calendar', 'Insert Date', (evt: MouseEvent) => {
			if (this.app.workspace.activeEditor == null || this.app.workspace.activeEditor?.editor == null) {
				return;
			}
			let editor = this.app.workspace.activeEditor!.editor!;

			editor.replaceRange(moment().format(dateFormat), editor.getCursor());
			let lineIndex = 0;
			while (editor.getLine(lineIndex)) {
				if (editor.getLine(lineIndex).startsWith(lastEditDateStr)) {
					editor.replaceRange(
						moment().format(dateFormat),
						{ line: lineIndex, ch: lastEditDateStr.length + 1 },
						{ line: lineIndex, ch: lastEditDateStr.length + dateFormat.length + 1 },
					)
					break;
				}
				lineIndex++;
			}
		});
	

		this.addCommand({
			id: "insert-date-by-location",
			name: "yes",
			editorCallback: (editor: Editor) => {
				editor.replaceRange(moment().format(dateFormat), editor.getCursor());
				editor.replaceRange(
					moment().format(dateFormat),
					{ line: lastEditDateLine, ch: lastEditDateCh },
					{ line: lastEditDateLine, ch: lastEditDateCh + dateFormat.length });
			}
		});

		this.addCommand({
			id: "insert-date-by-phrase",
			name: "Insert Date by Phrase",
			editorCallback: (editor: Editor) => {
				editor.replaceRange(moment().format(dateFormat), editor.getCursor());

				const currentFile = this.app.workspace.getActiveFile();
				let index = 0;
				while (editor.getLine(index)) {
					let text = editor.getLine(index);
					if (text.startsWith(lastEditDateStr)) {
						editor.replaceRange(
							moment().format(dateFormat),
							{ line: index, ch: lastEditDateStr.length + 1 },
							{ line: index, ch: lastEditDateStr.length + dateFormat.length + 1 },
						)
						break;
					}
					index++;
				}
			}
		});

		this.addCommand({
			id: "add-name",
			name: "Add Name",
			editorCallback: (editor: Editor) => {
				const files: TFile[] = this.app.vault.getMarkdownFiles();
				for (let index = 0; index < files.length; index++) {
					this.app.vault.read(files[index]).then((value) => {
						if (value.startsWith(nameListTitle)) {
							var nameList: string[] = value.split(nameListSplitStr);
							new SearchNameModal(editor, nameList.slice(1, nameList.length)).open();
						}
					})
				}
			}
		});

		/*
		this.addCommand({
			id: "add-name-to-list",
			name: "Add Name to List",
			editorCallback: (editor: Editor) => {
				const files: TFile[] = this.app.vault.getMarkdownFiles();
				for (let index = 0; index < files.length; index++) {
					this.app.vault.read(files[index]).then((value) => {
						if (value.startsWith(nameListTitle)) {
							
						}
					})
				}
			}
		})*/
		
		/*
		const ribbonIconAddName = this.addRibbonIcon('leaf', 'Add Collaborator Name', (evt: MouseEvent) => {
			const files: TFile[] = this.app.vault.getMarkdownFiles();
				for (let index = 0; index < files.length; index++) {
					this.app.vault.read(files[index]).then((value) => {
						if (value.startsWith(nameListTitle)) {
							var nameList: string[] = value.split(nameListSplitStr);
							new SearchNameModal(this.app.editor, nameList.slice(1, nameList.length)).open();
						}
					})
				}
		})
		*/

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('notice');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		/*this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			new Notice('click');
		});*/

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
