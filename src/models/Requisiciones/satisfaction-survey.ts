export type encuestaSatisfaccion = {
  id: string;
  Hora_inicio: Date;
  hora_finalizacion: Date;
  user_mail: string;
  user_name: string;
  did_team_review: boolean;
  did_team_submit_on_time: boolean;
  had_candidate_personal_presentation: boolean;
  was_candidate_correct_adn: boolean;
  had_candidate_correct_knowledge: boolean
}