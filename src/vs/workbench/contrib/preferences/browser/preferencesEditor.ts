/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from 'vs/base/common/lifecycle';
import { ICodeEditor } from 'vs/editor/browser/editorBrowser';
import { ConfigurationTarget } from 'vs/platform/configuration/common/configuration';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace';
import { IPreferencesRenderer, UserSettingsRenderer, WorkspaceSettingsRenderer } from 'vs/workbench/contrib/preferences/browser/preferencesRenderers';
import { IPreferencesService, ISetting } from 'vs/workbench/services/preferences/common/preferences';
import { SettingsEditorModel } from 'vs/workbench/services/preferences/common/preferencesModels';

export class SettingsEditorContribution extends Disposable {

	static readonly ID: string = 'editor.contrib.settings';

	constructor(
		private readonly editor: ICodeEditor,
		@IInstantiationService private readonly instantiationService: IInstantiationService,
		@IPreferencesService private readonly preferencesService: IPreferencesService,
		@IWorkspaceContextService private readonly workspaceContextService: IWorkspaceContextService
	) {
		super();
		this._createPreferencesRenderer();
		this._register(this.editor.onDidChangeModel(e => this._createPreferencesRenderer()));
		this._register(this.workspaceContextService.onDidChangeWorkbenchState(() => this._createPreferencesRenderer()));
	}

	private async _createPreferencesRenderer(): Promise<void> {
		const model = this.editor.getModel();
		if (model) {
			const settingsModel = await this.preferencesService.createPreferencesEditorModel(model.uri);
			let renderer: IPreferencesRenderer<ISetting> | undefined;
			if (settingsModel instanceof SettingsEditorModel && this.editor.getModel()) {
				switch (settingsModel.configurationTarget) {
					case ConfigurationTarget.USER_LOCAL:
					case ConfigurationTarget.USER_REMOTE:
					case ConfigurationTarget.WORKSPACE_FOLDER:
						renderer = this.instantiationService.createInstance(UserSettingsRenderer, this.editor, settingsModel);
					case ConfigurationTarget.WORKSPACE:
						renderer = this.instantiationService.createInstance(WorkspaceSettingsRenderer, this.editor, settingsModel);
				}
			}

			if (renderer) {
				renderer.render();
			}
		}
	}
}
