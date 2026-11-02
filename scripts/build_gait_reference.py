"""Build web/data/gait_reference.json from the public RBDS running dataset.

Source: Fukuchi RK, Fukuchi CA, Duarte M (2017). A public dataset of running
biomechanics and the effects of running speed on lower extremity kinematics and
kinetics. PeerJ 5:e3298. https://doi.org/10.7717/peerj.3298
Data: https://doi.org/10.6084/m9.figshare.4543435 (CC BY 4.0).

Usage: python scripts/build_gait_reference.py /path/to/RBDS_processed_files
Uses RBDS001 to RBDS028 processed.txt (the original paper cohort), sagittal
(Z axis) hip, knee and ankle angles at 2.5 m/s, both limbs. Toe-off is the
first sample after 5% of the cycle where vertical GRF (grfY) is missing or
below 5% of its peak. Curves are reported unchanged as mean and SD per sample.
"""
import glob, hashlib, json, os, sys
import numpy as np

folder = sys.argv[1]
files = sorted(glob.glob(os.path.join(folder, 'RBDS0[0-2][0-9]processed.txt')))
files = [f for f in files if 1 <= int(os.path.basename(f)[4:7]) <= 28]
assert len(files) == 28, len(files)
speed = '25'
curves = {'hip': [], 'knee': [], 'ankle': []}
toe_off = []
digest = hashlib.sha256()
for path in files:
    raw = open(path, 'rb').read(); digest.update(raw)
    header = [h.strip() for h in raw.decode().splitlines()[0].split('\t')]
    data = np.loadtxt(path, skiprows=1)
    for side in 'RL':
        for joint in curves:
            curves[joint].append(data[:, header.index(f'{side}{joint}AngZ{speed}')])
        grf = data[:, header.index(f'{side}grfY{speed}')]
        off = np.where(np.isnan(grf) | (grf <= .05 * np.nanmax(grf)))[0]
        toe_off.append(int(off[off > 5][0]))
out = {
    'source': 'Fukuchi RK, Fukuchi CA, Duarte M (2017). PeerJ 5:e3298. doi:10.7717/peerj.3298',
    'data_doi': '10.6084/m9.figshare.4543435',
    'licence': 'CC BY 4.0',
    'speed_m_s': 2.5, 'participants': len(files), 'limbs': len(toe_off),
    'convention': 'Z axis (sagittal), distal relative to proximal segment; hip and knee flexion positive, ankle dorsiflexion positive',
    'toe_off_pct_median': float(np.median(toe_off)),
    'toe_off_pct_iqr': [float(x) for x in np.percentile(toe_off, [25, 75])],
    'input_sha256': digest.hexdigest(),
}
for joint, rows in curves.items():
    a = np.array(rows)
    out[joint] = {'mean': [round(float(x), 2) for x in a.mean(0)], 'sd': [round(float(x), 2) for x in a.std(0, ddof=1)]}
json.dump(out, open('web/data/gait_reference.json', 'w'), separators=(',', ':'))
print('toe-off', out['toe_off_pct_median'], 'sha', out['input_sha256'][:16])
