mod models;
mod handlers;
mod services;

use axum::{
    routing::{get, post},
    Router,
};
use sqlx::mysql::MySqlPoolOptions;
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| "edokter_service=debug".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");

    let pool = MySqlPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to create pool");

    let app = Router::new()
        .route("/dashboard", get(handlers::dashboard::get_dashboard))
        .route("/queue", get(handlers::queue::get_queue))
        .route("/doctors", get(handlers::queue::get_doctors))
        .route("/monitoring", get(handlers::monitoring::get_monitoring))
        .route("/ranap", get(handlers::ranap::get_ranap_patients))
        .route("/registration", get(handlers::registration::get_registration_detail))
        .route("/soap/*no_rawat", post(handlers::soap::save_soap))
        .route("/soap-ranap/*no_rawat", post(handlers::soap::save_soap_ranap))
        .route("/soap-ranap/history/*no_rawat", get(handlers::soap::get_soap_history))
        .route("/search/icd", get(handlers::soap::search_icd))
        .route("/search/medicine", get(handlers::prescription::search_medicine))
        .route("/metode-racik", get(handlers::prescription::get_metode_racik))
        .route("/aturan-pakai", get(handlers::prescription::get_aturan_pakai))
        .route("/resep", post(handlers::prescription::save_prescription))
        .route("/resep/last/:no_rkm_medis", get(handlers::prescription::get_last_prescription))
        .route("/resep/restriction/:kode_brng/:kd_sps", get(handlers::prescription::get_medicine_restrictions))
        .route("/login", post(handlers::auth::login))
        .route("/poliklinik", get(handlers::poliklinik::get_poliklinik))
        .route("/search/lab", get(handlers::lab::search_lab_test))
        .route("/lab/template/:kd_jenis_prw", get(handlers::lab::get_lab_template))
        .route("/lab/save", post(handlers::lab::save_lab_request))
        .route("/search/radiology", get(handlers::radiology::search_radiology_test))
        .route("/radiology/save", post(handlers::radiology::save_radiology_request))
        .route("/resume-ranap/*no_rawat", get(handlers::resume::get_resume))
        .route("/resume-ranap", post(handlers::resume::save_resume))
        .route("/results/lab/:no_rawat", get(handlers::results::get_lab_results))
        .route("/results/radiology/:no_rawat", get(handlers::results::get_radiology_results))
        .route("/penilaian-medis-sp-dalam/*no_rawat", get(handlers::soap::get_penilaian_medis_penyakit_dalam))
        .route("/penilaian-medis-sp-dalam/save/*no_rawat", post(handlers::soap::save_penilaian_medis_penyakit_dalam))
        .route("/pemeriksaan-ralan/latest/*no_rawat", get(handlers::soap::get_latest_pemeriksaan_ralan))
        .route("/penilaian-medis-umum/*no_rawat", get(handlers::soap::get_penilaian_medis_umum))
        .route("/penilaian-medis-umum/save/*no_rawat", post(handlers::soap::save_penilaian_medis_umum))
        .route("/penilaian-medis-anak/*no_rawat", get(handlers::soap::get_penilaian_medis_anak))
        .route("/penilaian-medis-anak/save/*no_rawat", post(handlers::soap::save_penilaian_medis_anak))
        .route("/penilaian-medis-kandungan/*no_rawat", get(handlers::soap::get_penilaian_medis_kandungan))
        .route("/penilaian-medis-kandungan/save/*no_rawat", post(handlers::soap::save_penilaian_medis_kandungan))
        .route("/penilaian-medis-bedah/*no_rawat", get(handlers::soap::get_penilaian_medis_bedah))
        .route("/penilaian-medis-bedah/save/*no_rawat", post(handlers::soap::save_penilaian_medis_bedah))
        .route("/penilaian-medis-tht/*no_rawat", get(handlers::soap::get_penilaian_medis_tht))
        .route("/penilaian-medis-tht/save/*no_rawat", post(handlers::soap::save_penilaian_medis_tht))
        .route("/penilaian-medis-mata/*no_rawat", get(handlers::soap::get_penilaian_medis_mata))
        .route("/penilaian-medis-mata/save/*no_rawat", post(handlers::soap::save_penilaian_medis_mata))
        .route("/penilaian-medis-neurologi/*no_rawat", get(handlers::soap::get_penilaian_medis_neurologi))
        .route("/penilaian-medis-neurologi/save/*no_rawat", post(handlers::soap::save_penilaian_medis_neurologi))
        .route("/penilaian-medis-paru/*no_rawat", get(handlers::soap::get_penilaian_medis_paru))
        .route("/penilaian-medis-paru/save/*no_rawat", post(handlers::soap::save_penilaian_medis_paru))
        .route("/penilaian-medis-jantung/*no_rawat", get(handlers::soap::get_penilaian_medis_jantung))
        .route("/penilaian-medis-jantung/save/*no_rawat", post(handlers::soap::save_penilaian_medis_jantung))
        .route("/penilaian-medis-bedah-mulut/*no_rawat", get(handlers::soap::get_penilaian_medis_bedah_mulut))
        .route("/penilaian-medis-bedah-mulut/save/*no_rawat", post(handlers::soap::save_penilaian_medis_bedah_mulut))
        .route("/penilaian-medis-psikiatrik/*no_rawat", get(handlers::soap::get_penilaian_medis_psikiatrik))
        .route("/penilaian-medis-psikiatrik/save/*no_rawat", post(handlers::soap::save_penilaian_medis_psikiatrik))
        .route("/penilaian-medis-orthopedi/*no_rawat", get(handlers::soap::get_penilaian_medis_orthopedi))
        .route("/penilaian-medis-orthopedi/save/*no_rawat", post(handlers::soap::save_penilaian_medis_orthopedi))
        .route("/penilaian-medis-urologi/*no_rawat", get(handlers::soap::get_penilaian_medis_urologi))
        .route("/penilaian-medis-urologi/save/*no_rawat", post(handlers::soap::save_penilaian_medis_urologi))
        .route("/penilaian-medis-geriatri/*no_rawat", get(handlers::soap::get_penilaian_medis_geriatri))
        .route("/penilaian-medis-geriatri/save/*no_rawat", post(handlers::soap::save_penilaian_medis_geriatri))
        .route("/penilaian-medis-rehab-medik/*no_rawat", get(handlers::soap::get_penilaian_medis_rehab_medik))
        .route("/penilaian-medis-rehab-medik/save/*no_rawat", post(handlers::soap::save_penilaian_medis_rehab_medik))
        .route("/penilaian-medis-kulitdankelamin/*no_rawat", get(handlers::soap::get_penilaian_medis_kulitdankelamin))
        .route("/penilaian-medis-kulitdankelamin/save/*no_rawat", post(handlers::soap::save_penilaian_medis_kulitdankelamin))
        .route("/penilaian-medis-gd-psikiatri/*no_rawat", get(handlers::soap::get_penilaian_medis_gd_psikiatri))
        .route("/penilaian-medis-gd-psikiatri/save/*no_rawat", post(handlers::soap::save_penilaian_medis_gd_psikiatri))
        .route("/penilaian-medis-penyakit-dalam/*no_rawat", get(handlers::soap::get_penilaian_medis_penyakit_dalam))
        .route("/penilaian-medis-penyakit-dalam/save/*no_rawat", post(handlers::soap::save_penilaian_medis_penyakit_dalam))
        .route("/triase-igd/master", get(handlers::soap::get_master_triase))
        .route("/triase-igd/save/*no_rawat", post(handlers::soap::save_triase_igd))
        .route("/penilaian-medis-igd/*no_rawat", get(handlers::soap::get_penilaian_medis_igd))
        .route("/penilaian-medis-igd/save/*no_rawat", post(handlers::soap::save_penilaian_medis_igd))
        .route("/bpjs/icare/validate", post(handlers::bpjs::validate_icare))
        .route("/ai/soap-summary", post(handlers::ai::get_soap_summary))
        .route("/ai/sbar-summary", post(handlers::ai::get_sbar_summary))
        .route("/ai/resume-summary", post(handlers::ai::get_resume_summary))
        .route("/ai/resume-summary-ralan", post(handlers::ai::get_resume_summary_ralan))
        .route("/resume-ralan/:no_rawat", get(handlers::resume::get_resume_ralan))
        .route("/resume-ralan/save/*no_rawat", post(handlers::resume::save_resume_ralan))
        .layer(CorsLayer::permissive())
        .with_state(pool);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));
    tracing::debug!("listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
