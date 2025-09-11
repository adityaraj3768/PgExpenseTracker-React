import axios from "axios";
import { getApiUrl } from "../Utils/api";

export async function deleteGiveOrTake(recordId, token) {
  return axios.delete(getApiUrl(`/remove-give-or-take/${recordId}`), {
    headers: { Authorization: token ? `Bearer ${token}` : undefined },
  });
}
