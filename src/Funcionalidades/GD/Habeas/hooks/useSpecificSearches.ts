import React from "react";
import { useGraphServices } from "../../../../graph/graphContext"
import type { HabeasData } from "../../../../models/HabeasData";
import type { rsOption } from "../../../../models/Commons";
import { convertCommonToOptions, convertToCommonDTO } from "../../../Common/parseOptions";

export function useSpecificHabeasSearches() {
  const graph = useGraphServices()

  const [workers, setWorkers] = React.useState<HabeasData[]>([]);
  const [workersOptions, setWorkersOptions] = React.useState<rsOption[]>([]);


  const searchWorker = async (query: string): Promise<HabeasData[]> => {
    const resp = await graph.HabeasData.getAll({filter: `fields/Title eq '${query}'`, top: 200,});

    const foundWorkers = resp.items ?? [];
    setWorkers(foundWorkers);

    const convertedToCommon = foundWorkers.map(worker => convertToCommonDTO(worker));
    setWorkersOptions(convertCommonToOptions(convertedToCommon));

    return foundWorkers;
  };

  const searchRegister = async (query: string): Promise<HabeasData | null> => {
    const resp = await graph.HabeasData.findLastByDoc(query);

    return resp ? resp : null;
  };

  return {
    workers,
    workersOptions,
    searchRegister,
    searchWorker,
  };
}