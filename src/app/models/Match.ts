export type Status = 'Programado' | 'En Vivo' | 'Finalizado'
export interface Match {
  id?: number;
  localTeamID: number;
  awayTeamID: number;
  date: Date;
  championshipID: number;
  localGoals: number;
  awayGoals: number;

}
