import { useState } from 'react';
import { useAppContext } from '../utils/app.context';
import { CONFIG_DEFAULT, CONFIG_INFO } from '../Config';
import { isDev } from '../Config';
import StorageUtils from '../utils/storage';

type SettKey = keyof typeof CONFIG_DEFAULT;

const COMMON_SAMPLER_KEYS: SettKey[] = [
  'temperature',
  'top_k',
  'top_p',
  'min_p',
  'max_tokens',
];
const OTHER_SAMPLER_KEYS: SettKey[] = [
  'dynatemp_range',
  'dynatemp_exponent',
  'typical_p',
  'xtc_probability',
  'xtc_threshold',
];
const PENALTY_KEYS: SettKey[] = [
  'repeat_last_n',
  'repeat_penalty',
  'presence_penalty',
  'frequency_penalty',
  'dry_multiplier',
  'dry_base',
  'dry_allowed_length',
  'dry_penalty_last_n',
];

export default function SettingDialog({
  show,
  onClose,
}: {
  show: boolean;
  onClose: () => void;
}) {
  const { config, saveConfig } = useAppContext();

  // clone the config object to prevent direct mutation
  const [localConfig, setLocalConfig] = useState<typeof CONFIG_DEFAULT>(
    JSON.parse(JSON.stringify(config))
  );

  const resetConfig = () => {
    if (window.confirm('Are you sure to reset all settings?')) {
      setLocalConfig(CONFIG_DEFAULT);
    }
  };

  const handleSave = () => {
    saveConfig(localConfig);
    onClose();
  };

  const debugImportDemoConv = async () => {
    const res = await fetch('/demo-conversation.json');
    const demoConv = await res.json();
    StorageUtils.remove(demoConv.id);
    for (const msg of demoConv.messages) {
      StorageUtils.appendMsg(demoConv.id, msg);
    }
    onClose();
  };

  return (
    <dialog className={`modal ${show ? 'modal-open' : ''}`}>
      <div className="modal-box">
        <h3 className="text-lg font-bold mb-6">Settings</h3>
        <div className="h-[calc(90vh-12rem)] overflow-y-auto">
          <p className="opacity-40 mb-6">
            Settings below are saved in browser's localStorage
          </p>

          <SettingsModalShortInput
            configKey="apiKey"
            configDefault={CONFIG_DEFAULT}
            value={localConfig.apiKey}
            onChange={(value) =>
              setLocalConfig({ ...localConfig, apiKey: value })
            }
          />

          <label className="form-control mb-2">
            <div className="label">
              System Message (will be disabled if left empty)
            </div>
            <textarea
              className="textarea textarea-bordered h-24"
              placeholder={`Default: ${CONFIG_DEFAULT.systemMessage}`}
              value={localConfig.systemMessage}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  systemMessage: e.target.value,
                })
              }
            />
          </label>

          {COMMON_SAMPLER_KEYS.map((key) => (
            <SettingsModalShortInput
              key={key}
              configKey={key}
              configDefault={CONFIG_DEFAULT}
              value={localConfig[key]}
              onChange={(value) =>
                setLocalConfig({ ...localConfig, [key]: value })
              }
            />
          ))}

          <details className="collapse collapse-arrow bg-base-200 mb-2 overflow-visible">
            <summary className="collapse-title font-bold">
              Other sampler settings
            </summary>
            <div className="collapse-content">
              <SettingsModalShortInput
                label="Samplers queue"
                configKey="samplers"
                configDefault={CONFIG_DEFAULT}
                value={localConfig.samplers}
                onChange={(value) =>
                  setLocalConfig({ ...localConfig, samplers: value })
                }
              />
              {OTHER_SAMPLER_KEYS.map((key) => (
                <SettingsModalShortInput
                  key={key}
                  configKey={key}
                  configDefault={CONFIG_DEFAULT}
                  value={localConfig[key]}
                  onChange={(value) =>
                    setLocalConfig({ ...localConfig, [key]: value })
                  }
                />
              ))}
            </div>
          </details>

          <details className="collapse collapse-arrow bg-base-200 mb-2 overflow-visible">
            <summary className="collapse-title font-bold">
              Penalties settings
            </summary>
            <div className="collapse-content">
              {PENALTY_KEYS.map((key) => (
                <SettingsModalShortInput
                  key={key}
                  configKey={key}
                  configDefault={CONFIG_DEFAULT}
                  value={localConfig[key]}
                  onChange={(value) =>
                    setLocalConfig({ ...localConfig, [key]: value })
                  }
                />
              ))}
            </div>
          </details>

          <details className="collapse collapse-arrow bg-base-200 mb-2 overflow-visible">
            <summary className="collapse-title font-bold">
              Reasoning models
            </summary>
            <div className="collapse-content">
              <div className="flex flex-row items-center mb-2">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={localConfig.showThoughtInProgress}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      showThoughtInProgress: e.target.checked,
                    })
                  }
                />
                <span className="ml-4">
                  Expand though process by default for generating message
                </span>
              </div>
              <div className="flex flex-row items-center mb-2">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={localConfig.excludeThoughtOnReq}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      excludeThoughtOnReq: e.target.checked,
                    })
                  }
                />
                <span className="ml-4">
                  Exclude thought process when sending request to API
                  (Recommended for DeepSeek-R1)
                </span>
              </div>
            </div>
          </details>

          <details className="collapse collapse-arrow bg-base-200 mb-2 overflow-visible">
            <summary className="collapse-title font-bold">
              Advanced config
            </summary>
            <div className="collapse-content">
              {/* this button only shows in dev mode, used to import a demo conversation to test message rendering */}
              {isDev && (
                <div className="flex flex-row items-center mb-2">
                  <button className="btn" onClick={debugImportDemoConv}>
                    (debug) Import demo conversation
                  </button>
                </div>
              )}
              <div className="flex flex-row items-center mb-2">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={localConfig.showTokensPerSecond}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      showTokensPerSecond: e.target.checked,
                    })
                  }
                />
                <span className="ml-4">Show tokens per second</span>
              </div>
              <label className="form-control mb-2">
                <div className="label inline">
                  Custom JSON config (For more info, refer to{' '}
                  <a
                    className="underline"
                    href="https://github.com/ggerganov/llama.cpp/blob/master/examples/server/README.md"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    server documentation
                  </a>
                  )
                </div>
                <textarea
                  className="textarea textarea-bordered h-24"
                  placeholder='Example: { "mirostat": 1, "min_p": 0.1 }'
                  value={localConfig.custom}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, custom: e.target.value })
                  }
                />
              </label>
            </div>
          </details>
        </div>

        <div className="modal-action">
          <button className="btn" onClick={resetConfig}>
            Reset to default
          </button>
          <button className="btn" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </dialog>
  );
}

function SettingsModalShortInput({
  configKey,
  configDefault,
  value,
  onChange,
  label,
}: {
  configKey: SettKey;
  configDefault: typeof CONFIG_DEFAULT;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <label className="input input-bordered join-item grow flex items-center gap-2 mb-2">
      <div className="dropdown dropdown-hover">
        <div tabIndex={0} role="button" className="font-bold">
          {label || configKey}
        </div>
        <div className="dropdown-content menu bg-base-100 rounded-box z-10 w-64 p-2 shadow mt-4">
          {CONFIG_INFO[configKey] ?? '(no help message available)'}
        </div>
      </div>
      <input
        type="text"
        className="grow"
        placeholder={`Default: ${configDefault[configKey] || 'none'}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
