import { getDaysUntilExpiration } from "./dateUtils";
import { toast } from "react-toastify";

const LOW_STOCK = 2;

export const checkExpiringItems = (inventory) => {
  inventory.forEach((item) => {
    const expirationDays = getDaysUntilExpiration(item.expiration_date);
    if (expirationDays < 0) {
      toast.error(
        splitButtons(
          closeToast,
          item.name,
          Math.abs(expirationDays),
          "expired",
          ""
        ),
        {
          autoClose: 3000,
        }
      );
    } else if (expirationDays == 0) {
      toast.warning(splitButtons(closeToast, item.name, 0, "expiration", ""), {
        autoClose: 3000,
      });
    } else if (expirationDays == 1) {
      toast.warning(splitButtons(closeToast, item.name, 1, "expiration", ""), {
        autoClose: 3000,
      });
    } else if (expirationDays <= 3) {
      toast.warning(
        splitButtons(closeToast, item.name, expirationDays, "expiration", ""),
        {
          autoClose: 3000,
        }
      );
    }
  });
};

export const checkLowStock = (inventory) => {
  inventory.forEach((item) => {
    if (item.quantity <= LOW_STOCK) {
      toast.info(
        splitButtons(closeToast, item.name, "", "lowStock", item.quantity),
        {
          autoClose: 3000,
        }
      );
    }
  });
};

const closeToast = (type) => {};

const splitButtons = (closeToast, name, days = "", type, stock = "") => {
  // Styling from: https://fkhadra.github.io/react-toastify/how-to-style/
  return (
    <div className="grid grid-cols-[1fr_1px_80px] w-full">
      <div className="flex flex-col p-4">
        {type === "expiration" ? (
          <p>
            {name} expires in {days} day(s)
          </p>
        ) : type === "expired" ? (
          <p>{name} has expired!</p>
        ) : (
          <p className="text-sm">
            Running low on {name} ({stock} left)
          </p>
        )}
      </div>
      <div className="bg-zinc-900/20 h-full" />
      <div className="grid grid-rows-[1fr_1px_1fr] h-full">
        <button
          onClick={() => closeToast("dismiss")}
          className="text-purple-600"
        >
          Dismiss
        </button>
        <div className="bg-zinc-900/20 w-full" />
        <button onClick={() => closeToast("hide")}>Don't show again</button>
      </div>
    </div>
  );
};
