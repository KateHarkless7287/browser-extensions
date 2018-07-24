import { Controller } from 'cxp/lib/environment/controller'
import { Extension, ExtensionSettings } from 'cxp/lib/environment/extension'
import { ExecuteCommandParams } from 'cxp/lib/protocol'
import * as React from 'react'
import { from, Subject, Subscription } from 'rxjs'
import { catchError, map, mapTo, mergeMap, startWith } from 'rxjs/operators'
import { Key } from 'ts-key-enum'
import { asError, ErrorLike } from '../backend/errors'

/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * The platform targeted by this extension.
 */
export type ExtensionPlatform = BundleTarget | DockerTarget | WebSocketTarget | TcpTarget | ExecTarget

/**
 * Configuration for a Sourcegraph extension.
 */
export interface SourcegraphExtension {
    /**
     * The title of the extension. If not specified, the extension ID is used.
     */
    title?: string
    /**
     * A description of the extension's features and purpose. Markdown formatting is supported.
     */
    description?: string
    platform: ExtensionPlatform
    /**
     * A list of events that cause this extension to be activated. '*' means that it will always be activated.
     */
    activationEvents: string[]
    /**
     * Arguments provided to the extension upon initialization (in the `initialize` message's `initializationOptions` field).
     */
    args?: {
        [k: string]: any
    }
}
/**
 * A JavaScript file that is run as a Web Worker to provide this extension's functionality.
 */
export interface BundleTarget {
    type: 'bundle'
    /**
     * The MIME type of the source code. Only "application/javascript" (the default) is supported.
     */
    contentType?: string
    /**
     * A URL to a file containing the JavaScript source code to execute for this extension.
     */
    url: string
}
/**
 * A specification of how to run a Docker container to provide this extension's functionality.
 */
export interface DockerTarget {
    type: 'docker'
    /**
     * The Docker image to run.
     */
    image: string
}
/**
 * An existing WebSocket URL endpoint that serves this extension's functionality.
 */
export interface WebSocketTarget {
    type: 'websocket'
    /**
     * The WebSocket URL to communicate with.
     */
    url: string
}
/**
 * An existing TCP server that serves this extension's functionality.
 */
export interface TcpTarget {
    type: 'tcp'
    /**
     * The TCP address (`host:port`) of the server to communicate with.
     */
    address: string
}
/**
 * An local executable to run and communicate with over stdin/stdout to provide this extension's functionality.
 */
export interface ExecTarget {
    type: 'exec'
    /**
     * The path to the executable to run.
     */
    command: string
}

/**
 * Adds the manifest to CXP extensions in the CXP environment, so we can consult it in the createMessageTransports
 * callback (to know how to communicate with or run the extension).
 */
export interface CXPExtensionWithManifest extends Extension {
    manifest: ConfiguredExtension['manifest']
}

/**
 * React props or state containing the CXP controller. There should be only a single CXP controller for the whole
 * application.
 */
export interface CXPControllerProps {
    /**
     * The CXP controller, which is used to communicate with the extensions and manages extensions based on the CXP
     * environment.
     */
    cxpController: Controller<CXPExtensionWithManifest>
}
export interface Contributions {
    commands?: CommandContribution[]
    menus?: MenuContributions
}

export interface CommandContribution {
    command: string
    title?: string
    iconURL?: string
    experimentalSettingsAction?: CommandContributionSettingsAction
}

interface CommandContributionSettingsAction {
    path: (string | number)[]
    cycleValues?: any[]
    prompt?: string
}

export enum ContributableMenu {
    EditorTitle = 'editor/title',
}

interface MenuContributions extends Record<ContributableMenu, MenuItemContribution[]> {}

interface MenuItemContribution {
    command: string
    hidden?: boolean
}

/**
 * Describes a configured extension and its contributions. This value is propagated throughout the application.
 */
export interface ConfiguredExtension extends Pick<GQL.IConfiguredExtension, 'extensionID'> {
    /** The extension's contributions. */
    contributions?: Contributions

    /** The merged settings for the extension for the viewer. */
    settings: ExtensionSettings

    /** The parsed extension manifest, null if there is none, or a parse error. */
    manifest: SourcegraphExtension
}

/** The extensions in use. */
export type Extensions = ConfiguredExtension[]

/** Extended by React prop types that carry extensions. */
export interface ExtensionsProps {
    /** The enabled extensions. */
    extensions: Extensions
}

/** Extended by React prop types for components that need to signal a change to extensions. */
export interface ExtensionsChangeProps {
    onExtensionsChange: (enabledExtensions: Extensions) => void
}

interface Props extends CXPControllerProps {
    contributions: Contributions
    menu: ContributableMenu
}

export interface ContributedActionItemProps {
    contribution: CommandContribution
}

interface ContributedActionItemPropsProps extends ContributedActionItemProps, CXPControllerProps {}

const LOADING: 'loading' = 'loading'

interface State {
    /** The executed action: undefined while loading, null when done or not started, or an error. */
    actionOrError: typeof LOADING | null | ErrorLike
}

type ActionItemProps = {
    /** A tooltip to display when the user hovers or focuses this element. */
    ['data-tooltip']?: string

    /** The telemetry event to log; i.e., eventLogger.log(logEvent) is called. */
    logEvent?: string

    disabled?: boolean
} & (
    | {
          /** For non-links, called when the user clicks or presses enter on this element. */
          onSelect: () => void

          to?: never
          target?: never
      }
    | {
          /** For links, the link destination URL. */
          to: string

          /** The link target (use "_self" for external URLs). */
          target?: '_self'

          onSelect?: never
      })

/**
 * A button with an icon and optional text label displayed in a navbar.
 *
 * It is keyboard accessible: unlike <Link> or <a>, pressing the enter key triggers it. Unlike <button>, it shows a
 * focus ring.
 */
export class ActionItem extends React.PureComponent<ActionItemProps> {
    public render(): JSX.Element | null {
        const className = `nav-link ${this.props.disabled ? 'disabled' : ''}`

        if ('onSelect' in this.props) {
            // Render using an <a> with no href, so that we get a focus ring. We need to set up a keypress listener
            // because <a onclick> doesn't get triggered by enter.
            return (
                <a
                    className={className}
                    tabIndex={0}
                    data-tooltip={this.props['data-tooltip']}
                    onClick={this.onAnchorClick}
                    onKeyPress={this.onAnchorKeyPress}
                >
                    {this.props.children}
                </a>
            )
        }

        // Render using Link.
        return (
            <a
                href={this.props.to}
                target={this.props.target}
                className={className}
                tabIndex={0}
                data-tooltip={this.props['data-tooltip']}
            >
                {this.props.children}
            </a>
        )
    }

    private onAnchorClick: React.MouseEventHandler<HTMLAnchorElement> = e => {
        if (this.props.onSelect) {
            this.props.onSelect()
        }
    }

    private onAnchorKeyPress: React.KeyboardEventHandler<HTMLAnchorElement> = e => {
        if (isSelectKeyPress(e)) {
            if (this.props.onSelect) {
                this.props.onSelect()
            }
        }
    }
}

export class ContributedActionItem extends React.PureComponent<ContributedActionItemPropsProps> {
    public state: State = { actionOrError: null }

    private commandExecutions = new Subject<ExecuteCommandParams>()
    private subscriptions = new Subscription()

    public componentDidMount(): void {
        this.subscriptions.add(
            this.commandExecutions
                .pipe(
                    mergeMap(params =>
                        from(this.props.cxpController.registries.commands.executeCommand(params)).pipe(
                            mapTo(null),
                            catchError(error => [asError(error)]),
                            map(c => ({ actionOrError: c })),
                            startWith<Pick<State, 'actionOrError'>>({ actionOrError: LOADING })
                        )
                    )
                )
                .subscribe(stateUpdate => this.setState(stateUpdate), error => console.error(error))
        )
    }

    public componentWillUnmount(): void {
        this.subscriptions.unsubscribe()
    }

    public render(): JSX.Element | null {
        return (
            <ActionItem
                data-tooltip={this.props.contribution.iconURL ? this.props.contribution.title : undefined}
                disabled={this.state.actionOrError === LOADING}
                onSelect={this.runAction}
            >
                {this.props.contribution.iconURL ? (
                    <img src={this.props.contribution.iconURL} className="action-item--image mr-1" />
                ) : (
                    <span className="action-item--title d-md-none d-lg-inline mr-1">
                        {this.props.contribution.title}
                    </span>
                )}
            </ActionItem>
        )
    }

    private runAction = () => {
        this.commandExecutions.next({ command: this.props.contribution.command })
    }
}

export const ContributedActions: React.SFC<Props> = props => {
    const items: ContributedActionItemProps[] = []
    if (
        props.contributions &&
        props.contributions.commands &&
        props.contributions.menus &&
        props.contributions.menus[props.menu]
    ) {
        for (const { command: commandID, hidden } of props.contributions.menus[props.menu]) {
            const command = props.contributions.commands.find(c => c.command === commandID)
            if (command && !hidden) {
                items.push({
                    contribution: command,
                })
            }
        }
    }

    return (
        <>{items.map((item, i) => <ContributedActionItem key={i} {...item} cxpController={props.cxpController} />)}</>
    )
}

function isSelectKeyPress(e: React.KeyboardEvent<Element>): boolean {
    return e.key === Key.Enter && !e.ctrlKey && !e.shiftKey && !e.metaKey && !e.altKey
}
