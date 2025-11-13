import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Lock, Store, Info, Eye, Clock, Users, XCircle } from 'lucide-react';

export const PlanningConceptsInfo = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Info className="h-4 w-4 mr-2" />
          Aide Planning
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Guide du Planning - Concepts et Fonctionnalités
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Section 1: Différence Lock vs Fermé */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <Store className="h-5 w-5" />
              Différence entre "Lock" et "Fermé"
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-orange-600" />
                  <Badge variant="outline" className="bg-orange-50 text-orange-700">
                    VERROUILLAGE (Lock)
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <p><strong>Objectif :</strong> Protéger un shift spécifique contre les modifications accidentelles</p>
                  <p><strong>Le magasin reste :</strong> Ouvert et opérationnel</p>
                  <p><strong>Les employés :</strong> Travaillent normalement</p>
                  <p><strong>Restrictions :</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Pas de drag & drop d'employés</li>
                    <li>Pas de modification des heures</li>
                    <li>Pas de changement des affectations</li>
                    <li>Planning fixé et sécurisé</li>
                  </ul>
                  <p><strong>Utilisation :</strong> Quand le planning est finalisé et validé</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <Badge variant="destructive" className="bg-red-50 text-red-700">
                    MAGASIN FERMÉ
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <p><strong>Objectif :</strong> Indiquer que l'établissement est fermé ce jour-là</p>
                  <p><strong>Le magasin est :</strong> Complètement fermé au public</p>
                  <p><strong>Les employés :</strong> Ne travaillent pas</p>
                  <p><strong>Effets :</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Aucune affectation d'employé possible</li>
                    <li>Affichage "Magasin Fermé" sur le planning</li>
                    <li>Pas d'heures d'ouverture affichées</li>
                    <li>Jour férié, congé exceptionnel, etc.</li>
                  </ul>
                  <p><strong>Utilisation :</strong> Jours fériés, fermeture exceptionnelle, maintenance</p>
                </div>
              </div>
            </div>

            <Separator className="my-4" />
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">💡 Conseil d'utilisation</h4>
              <p className="text-sm text-blue-800">
                Utilisez le <strong>Lock</strong> pour protéger un planning validé, et <strong>Fermé</strong> 
                pour les jours où l'établissement ne fonctionne pas du tout.
              </p>
            </div>
          </Card>

          {/* Section 2: Vues du Planning */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Vues du Planning
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Badge variant="outline">Vue Jour</Badge>
                <p className="text-sm">Focus sur une journée spécifique avec tous les détails des shifts</p>
              </div>
              <div className="space-y-2">
                <Badge variant="outline">Vue Semaine</Badge>
                <p className="text-sm">Aperçu hebdomadaire pour une planification globale</p>
              </div>
              <div className="space-y-2">
                <Badge variant="outline">Vue Mois</Badge>
                <p className="text-sm">Vision mensuelle pour la planification à long terme</p>
              </div>
              <div className="space-y-2">
                <Badge variant="outline" className="bg-blue-50">Vue Horaire</Badge>
                <p className="text-sm">Grille de 8h à 23h pour gérer les heures individuelles précisément</p>
              </div>
            </div>
          </Card>

          {/* Section 3: Gestion des Heures */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Gestion des Heures par Employé
            </h3>
            
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">✅ Nouvelles Fonctionnalités</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Heures différentes par employé sur le même shift</li>
                  <li>• Filtrage par tranches horaires (début/fin)</li>
                  <li>• Collections d'heures pour grouper les employés</li>
                  <li>• Vue grille horaire de 8h à 23h</li>
                </ul>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Assignation Flexible</h4>
                  <p className="text-sm text-muted-foreground">
                    Chaque employé peut avoir ses propres heures de début et fin, 
                    même s'ils travaillent le même jour.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Filtrage Intelligent</h4>
                  <p className="text-sm text-muted-foreground">
                    Trouvez rapidement les employés qui travaillent dans 
                    certaines tranches horaires pour optimiser la gestion.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 4: Génération Automatique */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Génération Automatique de Planning
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Badge variant="secondary">Par Jour</Badge>
                <p className="text-sm">Génération optimisée pour une journée spécifique</p>
              </div>
              <div className="space-y-2">
                <Badge variant="secondary">Par Semaine</Badge>
                <p className="text-sm">Planification complète sur 7 jours</p>
              </div>
              <div className="space-y-2">
                <Badge variant="secondary">Par Mois</Badge>
                <p className="text-sm">Vue d'ensemble mensuelle avec optimisation globale</p>
              </div>
            </div>
            
            <div className="mt-4 bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">⚙️ Critères d'Optimisation</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Préférences et disponibilités des employés</li>
                <li>• Respect des conflits et relations</li>
                <li>• Priorité aux vétérans pour encadrer les nouveaux</li>
                <li>• Équilibrage des heures de travail</li>
              </ul>
            </div>
          </Card>

          {/* Section 5: Raccourcis et Astuces */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">🚀 Raccourcis et Astuces</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Drag & Drop</h4>
                <ul className="text-sm space-y-1">
                  <li>• Glissez un employé sur un shift pour l'assigner</li>
                  <li>• Sélectionnez plusieurs employés pour assignation en masse</li>
                  <li>• Les shifts verrouillés refusent le drop</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Edition Rapide</h4>
                <ul className="text-sm space-y-1">
                  <li>• Clic sur les heures pour modification directe</li>
                  <li>• Toggle fermeture/ouverture en un clic</li>
                  <li>• Boutons +/- pour ajuster la durée</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setOpen(false)}>
            Compris !
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};