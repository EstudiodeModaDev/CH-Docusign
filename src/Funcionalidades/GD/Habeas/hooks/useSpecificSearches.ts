import React from "react";
import type { HabeasData } from "../../../../models/HabeasData";
import type { rsOption } from "../../../../models/Commons";
import { convertCommonToOptions, convertToCommonDTO } from "../../../Common/parseOptions";
import { useGestorServices } from "../../../../graph/graphContext";

export function useSpecificHabeasSearches() {
  const {HabeasData} = useGestorServices()

  const [workers, setWorkers] = React.useState<HabeasData[]>([]);
  const [workersOptions, setWorkersOptions] = React.useState<rsOption[]>([]);


  const searchWorker = async (query: string): Promise<HabeasData[]> => {
    const resp = await HabeasData.getAll({filter: `fields/NumeroDocumento eq '${query}'`, top: 200,});

    const foundWorkers = resp.items ?? [];
    setWorkers(foundWorkers);

    const convertedToCommon = foundWorkers.map(worker => convertToCommonDTO(worker));
    setWorkersOptions(convertCommonToOptions(convertedToCommon));

    return foundWorkers;
  };

  const searchRegister = async (query: string): Promise<HabeasData | null> => {
    const resp = await HabeasData.findLastByDoc(query);

    return resp ? resp : null;
  };

  return {
    workers,
    workersOptions,
    searchRegister,
    searchWorker,
  };
}