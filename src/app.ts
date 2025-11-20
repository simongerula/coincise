import { fetchAssets, deleteAsset } from "./api.ts";
import { createAssetCard } from "./components/assetCard.ts";
import { createModal } from "./components/Modals.ts";
import { formatMonthLabel, getLastSixMonths } from "./utils.ts";
