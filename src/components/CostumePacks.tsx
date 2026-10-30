import { useState } from "react";
import type { State } from "../lib/economy";
import { balance } from "../lib/economy";
import { costumeNames, packs, type PackSetting } from "../lib/packs";
import { Fox } from "./Art";
import type { Appearance } from "../lib/appearance";

export function CostumePacks({
  state,
  onBuy,
  onWear,
}: {
  state: State;
  onBuy: (id: string, price: number) => Promise<boolean>;
  onWear: (outfit: Appearance["outfit"]) => void;
}) {
  const [preview, setPreview] = useState<Record<string, Appearance["outfit"]>>(
    {},
  );
  const [confirm, setConfirm] = useState<{ id: string; price: number } | null>(
      null,
    ),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const wallet = balance(state);
  return (
    <section className="costume-collection">
      {state.packSupport === false && (
        <p className="notice">
          Costume purchases are waiting for the server update. You can preview
          the collection and keep using your everyday outfits.
        </p>
      )}
      <div className="section-heading">
        <div>
          <div className="eyebrow">A WARDROBE FULL OF STORIES</div>
          <h2>Pip’s special costume packs</h2>
          <p>
            One purchase keeps every costume in the pack. No goal or approval
            request needed.
          </p>
        </div>
        <strong>{wallet} coins</strong>
      </div>
      {message && (
        <p role="status" className="pack-message">
          {message}
        </p>
      )}
      <div className="costume-pack-grid">
        {packs.map((pack) => {
          const owned = state.ownedPacks?.includes(pack.id) ?? false,
            setting = state.packSettings?.[pack.id],
            outfit = preview[pack.id] ?? pack.costumes[0];
          const confirming = confirm?.id === pack.id,
            changed = confirming && confirm.price !== setting?.price;
          return (
            <article
              className={`costume-pack ${owned ? "owned" : ""}`}
              key={pack.id}
            >
              <div
                className="pack-preview"
                style={{
                  background: `linear-gradient(140deg,${pack.color}28,#fff9ec)`,
                }}
              >
                <Fox look={{ ...state.appearance, outfit, hat: "none" }} />
                <span className="pack-count">4 costumes</span>
              </div>
              <div className="pack-body">
                <div className="eyebrow">
                  {owned
                    ? "IN YOUR WARDROBE"
                    : setting?.enabled
                      ? "READY TO DISCOVER"
                      : "WAITING FOR YOUR GROWN-UP"}
                </div>
                <h3>
                  {pack.icon} {pack.name}
                </h3>
                <p>{pack.description}</p>
                <div
                  className="pack-costumes"
                  aria-label={`${pack.name} costume previews`}
                >
                  {pack.costumes.map((id) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={outfit === id}
                      onClick={() => setPreview({ ...preview, [pack.id]: id })}
                    >
                      {costumeNames[id]}
                    </button>
                  ))}
                </div>
                {owned ? (
                  <button className="primary" onClick={() => onWear(outfit)}>
                    Wear {costumeNames[outfit as keyof typeof costumeNames]}
                  </button>
                ) : !setting?.enabled ? (
                  <p className="fine-print">
                    Your grown-up can open this pack and choose its coin price.
                  </p>
                ) : confirming ? (
                  <div className="pack-confirm">
                    <strong>
                      {changed
                        ? "The price changed. Review it before buying."
                        : `Unlock all four costumes for ${setting.price} coins?`}
                    </strong>
                    <button
                      className="primary"
                      disabled={busy || wallet < setting.price}
                      onClick={async () => {
                        if (changed) {
                          setConfirm({ id: pack.id, price: setting.price });
                          return;
                        }
                        setBusy(true);
                        try {
                          if (await onBuy(pack.id, confirm.price)) {
                            setMessage(
                              `${pack.name} is yours! Pick a costume to wear.`,
                            );
                            setConfirm(null);
                          }
                        } catch (error) {
                          setMessage((error as Error).message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      {busy
                        ? "Opening your pack…"
                        : changed
                          ? `Review ${setting.price} coins`
                          : `Buy for ${setting.price} coins`}
                    </button>
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() => setConfirm(null)}
                    >
                      Keep browsing
                    </button>
                  </div>
                ) : (
                  <button
                    className="primary"
                    disabled={busy || wallet < setting.price}
                    onClick={() => {
                      setMessage("");
                      setConfirm({ id: pack.id, price: setting.price });
                    }}
                  >
                    {wallet < setting.price
                      ? `${setting.price - wallet} more coins needed`
                      : `Get pack · ${setting.price} coins`}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function ParentPackSettings({
  state,
  onSave,
}: {
  state: State;
  onSave: (id: string, setting: PackSetting) => Promise<boolean>;
}) {
  const [busy, setBusy] = useState<string | null>(null),
    [message, setMessage] = useState("");
  return (
    <section className="panel">
      {state.packSupport === false && (
        <p className="notice">
          Costume packs need the new Firestore rules before they can be
          configured. Regular practice and family rewards remain available.
        </p>
      )}
      <h2>Special costume packs</h2>
      <p>
        You choose the price for each pack. Once enabled, your child can buy it
        immediately with earned coins. These purchases do not need a goal or a
        reward approval. Owned packs remain owned when you change prices or
        close a pack.
      </p>
      <p className="fine-print">
        All packs start closed. A price of 0 makes an enabled pack free. Each
        pack can be purchased only once.
      </p>
      {message && <p role="status">{message}</p>}
      <div className="parent-pack-list">
        {packs.map((pack) => {
          const setting = state.packSettings?.[pack.id];
          return (
            <form
              key={`${pack.id}-${setting?.price}-${setting?.enabled}`}
              className="parent-pack-row"
              onSubmit={async (event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                setBusy(pack.id);
                setMessage("");
                try {
                  if (
                    await onSave(pack.id, {
                      price: Number(form.get("price")),
                      enabled: form.get("enabled") === "on",
                    })
                  )
                    setMessage(`${pack.name} settings saved.`);
                } catch (error) {
                  setMessage((error as Error).message);
                } finally {
                  setBusy(null);
                }
              }}
            >
              <div>
                <h3>
                  {pack.icon} {pack.name}
                </h3>
                <p>{pack.costumes.map((id) => costumeNames[id]).join(" · ")}</p>
                {state.ownedPacks?.includes(pack.id) && (
                  <strong>Already owned</strong>
                )}
              </div>
              <label>
                Coin price for {pack.name}
                <input
                  name="price"
                  type="number"
                  min="0"
                  max="1000000"
                  step="1"
                  required
                  defaultValue={setting?.price ?? 0}
                />
              </label>
              <label className="pack-enable">
                <input
                  name="enabled"
                  type="checkbox"
                  defaultChecked={setting?.enabled ?? false}
                />
                Open this pack
              </label>
              <button
                className="primary"
                disabled={busy !== null || state.packSupport === false}
              >
                {busy === pack.id ? "Saving…" : "Save pack"}
              </button>
            </form>
          );
        })}
      </div>
    </section>
  );
}
