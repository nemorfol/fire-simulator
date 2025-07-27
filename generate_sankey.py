import plotly.graph_objects as go
import json
import sys

# Dati forniti dall'utente (questi verranno passati dinamicamente in futuro)
sankey_data_str = sys.argv[1] if len(sys.argv) > 1 else '{"nodes":[{"name":"Entrate Ricorrenti"},{"name":"Entrate Lump Sum"},{"name":"Entrate"},{"name":"Uscite"},{"name":"Tasse"},{"name":"Risparmio"},{"name":"Uscite Ricorrenti"},{"name":"Uscite Lump Sum"},{"name":"Imposta Reddito"},{"name":"Imposta Rendite"},{"name":"Risparmio da Reddito"},{"name":"Risparmio da Rendimento"}],"links":[{"source":2,"target":3,"value":22188.361387479898},{"source":2,"target":4,"value":1708.0331566331},{"source":4,"target":9,"value":1708.0331566331},{"source":5,"target":11,"value":4861.325138109592}]}'

sankey_data = json.loads(sankey_data_str)

nodes = sankey_data['nodes']
links = sankey_data['links']

# Mappa i nomi dei nodi agli indici
node_names = [node['name'] for node in nodes]

# Prepara i dati per Plotly
plotly_links = {
    'source': [link['source'] for link in links],
    'target': [link['target'] for link in links],
    'value': [link['value'] for link in links],
    'label': [f"{node_names[link['source']]} -> {node_names[link['target']]}: {link['value']:.2f}" for link in links]
}

fig = go.Figure(data=[go.Sankey(
    node=dict(
        pad=15,
        thickness=20,
        line=dict(color="black", width=0.5),
        label=node_names,
        color="blue"  # Puoi personalizzare i colori qui
    ),
    link=dict(
        source=plotly_links['source'],
        target=plotly_links['target'],
        value=plotly_links['value'],
        label=plotly_links['label']
    ))])

fig.update_layout(title_text="Sankey Diagram from Python", font_size=10)

# Stampa il JSON del grafico sulla console
print(fig.to_json())